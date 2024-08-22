import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Globalfilter } from '../componenets/Globalfilter';
import TableBody from '../componenets/Tablebody';
import Pagination from '../componenets/Pagination';
import { useTable, useGlobalFilter, usePagination } from 'react-table';
import { useAuth } from "../AuthContext";
import styles from "../styles/pages.module.css"
import { toast } from 'react-toastify';
import { quotationColumns } from '../config/quotationscolumns'
import NewQuotationItem from "./NewQuotationItem";
import QuotationReceipt from "./QuotationReceipt";
import FormModal from "../componenets/FormModal";
import { paymentFormConfig } from '../config/formconfig'
import UploadQuotationFiles from '../componenets/UploadQuotationFiles'
import UploadModal from "../componenets/UploadModal";



export default function Orders() {
    const { accessToken } = useAuth();
    const [newItemMode, setNewItemMode] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showFiles, setShowFiles] = useState(false);
    const [paymentModal, setPaymentModal] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState("")
    const [paymentFormData, setPaymentFormData] = useState({ amount_paid: '' });
    const [quotations, setQuotations] = useState([]);
    const [filters, setFilters] = useState({
        globalFilter: "",
        location: "",
        startDate: "",
        endDate: "",
    });

    const fetchQuotations = useCallback(async () => {
        try {
            const { location, startDate, endDate } = filters;
            let url = `/api/quotations/fetch_quotations`;
            const queryParams = [];
            if (location) {
                queryParams.push(`location=${encodeURIComponent(location)}`);
            }
            if (startDate) {
                queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
            }
            if (endDate) {
                queryParams.push(`endDate=${encodeURIComponent(endDate)}`);
            }
            if (queryParams.length > 0) {
                url += `?${queryParams.join('&')}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            });

            if (!response.ok) {
                throw new Error("Network response was not okay");
            }

            const data = await response.json();
            setQuotations(data);
        } catch (error) {
            console.error("Error fetching quotations", error);
        }
    }, [filters, accessToken]);


    const cancelQuotation = useCallback(async (id) => {
        try {
            const response = await fetch(`/api/quotations/cancel/${id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            })
            if (!response.ok) {
                console.error("network response was not okay")
            }

            const data = await response.json()
            toast.success(data.message)


            fetchQuotations()
        }
        catch (error) {
            console.error("error Updating status", error)
        }

    }, [fetchQuotations, accessToken])



    useEffect(() => {
        fetchQuotations();
    }, [fetchQuotations, newItemMode]);



    const addNewItem = useCallback((id) => {
        setSelectedQuotation(id)
        setNewItemMode(true)
    }, [])

    const viewReceipt = useCallback((id) => {
        setShowReceipt(true)
        setSelectedQuotation(id)
    }, [])

    const addPayment = useCallback((id) => {
        setSelectedQuotation(id);
        setPaymentModal(true);
    }, []);
    const viewFiles = useCallback((id) => {
        setSelectedQuotation(id);
        setShowFiles(true);
    }, [])

    const handlePaymentInput = useCallback((name, value) => {
        setPaymentFormData({ ...paymentFormData, [name]: value });
    }, [paymentFormData]);

    const handlePaymentSubmit = useCallback(async (e) => {
        e.preventDefault();
        try {
            const { amount_paid } = paymentFormData;

            const response = await fetch(`/api/quotations/add_payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    ref_number: selectedQuotation,
                    amount_paid: Number(amount_paid), // Convert to number
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            toast.success(data.message);
            setPaymentModal(false);
            fetchQuotations();
        } catch (error) {
            console.error('Error adding payment:', error);
            toast.error('Failed to add payment');
        }
    }, [selectedQuotation, paymentFormData, accessToken, fetchQuotations]);



    const deleteQuotation = useCallback(async (id) => {
        try {
            const response = await fetch(`/api/quotations/delete/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            })
            if (!response.ok) {
                console.error("network response was not okay")
            }

            const data = await response.json()
            toast.success(data.message)


            fetchQuotations()
        }
        catch (error) {
            console.error("error deleting Quotation", error)
        }

    }, [fetchQuotations, accessToken])


    const columns = useMemo(() => [...quotationColumns, {
        Header: 'Actions',
        Cell: ({ row }) => (
            <div className={styles.actionsContainer}>
                {row.original.status !== 'canceled' && (
                    <>
                        <button className={`${styles.actionButton} ${styles.delete}`} onClick={() => cancelQuotation(row.original.ref_number)}>Cancel</button>
                        <button className={`${styles.actionButton} ${styles.update}`} onClick={() => addNewItem(row.original.ref_number)}>Add New Item</button>
                        <button className={`${styles.actionButton} ${styles.update}`} onClick={() => addPayment(row.original.ref_number)}>Add Payment</button>
                        <button className={`${styles.actionButton} ${styles.payment}`} onClick={() => viewReceipt(row.original.ref_number)}>View Receipt</button>
                        <button className={`${styles.actionButton} ${styles.payment}`} onClick={() => viewFiles(row.original.ref_number)}>Upload Files</button>
                    </>
                )}
                {row.original.status === 'canceled' && (
                    <>
                        <button className={`${styles.actionButton} ${styles.delete}`} onClick={() => deleteQuotation(row.original.ref_number)}>Delete</button>
                    </>
                )}




            </div>
        )
    }], [cancelQuotation, addNewItem, viewReceipt, deleteQuotation, addPayment, viewFiles]);

    const data = useMemo(() => quotations, [quotations]);

    const tableInstance = useTable({
        columns: columns,
        data: data,
        initialState: {
            globalFilter: filters.globalFilter
        }
    }, useGlobalFilter, usePagination);

    if (newItemMode) {
        return <NewQuotationItem setNewItemMode={setNewItemMode} selectedQuotation={selectedQuotation} />
    }



    return (
        <div className={styles.page}>
            <header className={styles.header}>Quotations</header>
            <div className={styles.content}>
                <Globalfilter filters={filters} setFilters={setFilters} showLocationFilter={false} />
                <TableBody tableInstance={tableInstance} />
                <Pagination tableInstance={tableInstance} />
                {showReceipt && (
                    <QuotationReceipt selectedQuotation={selectedQuotation} setShowReceipt={setShowReceipt} />
                )}
                {paymentModal && (
                    <FormModal
                        isOpen={paymentModal}
                        onClose={() => setPaymentModal(false)}
                        title="Add Payment"
                        config={paymentFormConfig}
                        formData={paymentFormData}
                        handleInput={handlePaymentInput}
                        handleSubmit={handlePaymentSubmit}
                    />
                )}
                {showFiles && (
                    <UploadQuotationFiles isOpen={UploadModal} onClose={() => setShowFiles(false)} quotationId={selectedQuotation} />
                )}

            </div>
        </div>
    );
}
