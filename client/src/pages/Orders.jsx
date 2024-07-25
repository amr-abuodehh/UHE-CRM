import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Globalfilter } from '../componenets/Globalfilter';
import TableBody from '../componenets/Tablebody';
import Pagination from '../componenets/Pagination';
import { useTable, useGlobalFilter, usePagination } from 'react-table';
import { useAuth } from "../AuthContext";
import styles from "../styles/suppliers.module.css"
import { toast } from 'react-toastify';
import { orderColumns } from '../config/ordercolumns'
import NewOrderItem from "./NewOrderItem";
import OrderReceipt from "./OrderReceipt";
import FormModal from "../componenets/FormModal";
import { paymentFormConfig } from '../config/formconfig'
import UploadOrderFiles from "../componenets/UploadOrderFiles";
import UploadModal from "../componenets/UploadModal";



export default function Orders() {
    const { accessToken } = useAuth();
    const [newItemMode, setNewItemMode] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showFiles, setShowFiles] = useState(false);
    const [paymentModal, setPaymentModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState("")
    const [paymentFormData, setPaymentFormData] = useState({ amount_payed: '' });
    const [orders, setOrders] = useState([]);
    const [filters, setFilters] = useState({
        globalFilter: "",
        location: "",
        startDate: "",
        endDate: "",
    });

    const fetchOrders = useCallback(async () => {
        try {
            const { location, startDate, endDate } = filters;
            let url = `/api/orders/fetch_orders`;
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
            setOrders(data);
        } catch (error) {
            console.error("Error fetching clients", error);
        }
    }, [filters, accessToken]);


    const cancelOrder = useCallback(async (id) => {
        try {
            const response = await fetch(`/api/orders/cancel/${id}`, {
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


            fetchOrders()
        }
        catch (error) {
            console.error("error Updating status", error)
        }

    }, [fetchOrders, accessToken])



    useEffect(() => {
        fetchOrders();
    }, [fetchOrders, newItemMode]);



    const addNewItem = useCallback((id) => {
        setSelectedOrder(id)
        setNewItemMode(true)
    }, [])

    const viewReceipt = useCallback((id) => {
        setShowReceipt(true)
        setSelectedOrder(id)
    }, [])

    const addPayment = useCallback((id) => {
        setSelectedOrder(id);
        setPaymentModal(true);
    }, []);

    const viewFiles = useCallback((id) => {
        setSelectedOrder(id);
        setShowFiles(true);
    }, [])

    const handlePaymentInput = useCallback((name, value) => {
        setPaymentFormData({ ...paymentFormData, [name]: value });
    }, [paymentFormData]);

    const handlePaymentSubmit = useCallback(async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/orders/add_payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ orderId: selectedOrder, ...paymentFormData })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            toast.success(data.message);
            setPaymentModal(false);
            fetchOrders();
        } catch (error) {
            console.error('Error adding payment:', error);
            toast.error('Failed to add payment');
        }
    }, [selectedOrder, paymentFormData, accessToken, fetchOrders]);



    const deleteOrder = useCallback(async (id) => {
        try {
            const response = await fetch(`/api/orders/delete/${id}`, {
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


            fetchOrders()
        }
        catch (error) {
            console.error("error deleting order", error)
        }

    }, [fetchOrders, accessToken])


    const columns = useMemo(() => [...orderColumns, {
        Header: 'Actions',
        Cell: ({ row }) => (
            <div className={styles.actionsContainer}>
                {row.original.status !== 'canceled' && (
                    <>
                        <button className={`${styles.actionButton} ${styles.delete}`} onClick={() => cancelOrder(row.original.id)}>Cancel</button>
                        <button className={`${styles.actionButton} ${styles.update}`} onClick={() => addNewItem(row.original.id)}>Add New Item</button>
                        <button className={`${styles.actionButton} ${styles.update}`} onClick={() => addPayment(row.original.id)}>Add Payment</button>
                        <button className={`${styles.actionButton} ${styles.payment}`} onClick={() => viewReceipt(row.original.id)}>View Items</button>
                        <button className={`${styles.actionButton} ${styles.payment}`} onClick={() => viewFiles(row.original.id)}>Upload Files</button>
                    </>
                )}
                {row.original.status === 'canceled' && (
                    <>
                        <button className={`${styles.actionButton} ${styles.delete}`} onClick={() => deleteOrder(row.original.id)}>Delete</button>
                    </>
                )}




            </div>
        )
    }], [cancelOrder, addNewItem, viewReceipt, deleteOrder, addPayment, viewFiles]);

    const data = useMemo(() => orders, [orders]);

    const tableInstance = useTable({
        columns: columns,
        data: data,
        initialState: {
            globalFilter: filters.globalFilter
        }
    }, useGlobalFilter, usePagination);

    if (newItemMode) {
        return <NewOrderItem setNewItemMode={setNewItemMode} selectedOrder={selectedOrder} />
    }



    return (
        <div className={styles.page}>
            <header className={styles.header}>Supplier Orders</header>
            <div className={styles.content}>
                <Globalfilter filters={filters} setFilters={setFilters} showLocationFilter={false} />
                <TableBody tableInstance={tableInstance} className={styles.table} />
                <Pagination tableInstance={tableInstance} className={styles.pagination} />
                {showReceipt && (
                    <OrderReceipt selectedOrder={selectedOrder} setShowReceipt={setShowReceipt} />
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
                {
                    showFiles && (
                        <UploadOrderFiles isOpen={UploadModal} onClose={() => setShowFiles(false)} orderId={selectedOrder} />
                    )
                }

            </div>
        </div>
    );
}
