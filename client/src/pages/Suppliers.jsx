import { suppliercols } from '../config/suppliercolumns';
import styles from '../styles/pages.module.css';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable, useGlobalFilter, usePagination } from 'react-table';
import { Globalfilter } from '../componenets/Globalfilter';
import TableBody from '../componenets/Tablebody';
import CreateSupplier from '../pages/CreateSupplier';
import Pagination from '../componenets/Pagination';
import { useAuth } from '../AuthContext';
import { toast } from 'react-toastify';



export default function Suppliers() {

    const { accessToken } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [filters, setFilters] = useState({
        globalFilter: "",
        location: "",
        startDate: "",
        endDate: "",
    });
    const [updateMode, setUpdateMode] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState([]);


    //fetch Suppliers and pass Filters

    const fetchSuppliers = useCallback(async () => {
        try {
            const { location, startDate, endDate } = filters;
            let url = '/api/suppliers/fetch';
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
                },
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            setSuppliers(data);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    }, [filters, accessToken]);

    //Supplier table Action buttons

    //Delete Suppliers by ID
    const deleteSuppliers = useCallback(async (id) => {
        try {
            const response = await fetch(`/api/suppliers/delete/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },

            });
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const data = await response.json()
            toast.success(data.message)
            fetchSuppliers();
        } catch (error) {
            console.error('Error Deleting supplier', error);
        }
    }, [fetchSuppliers, accessToken]);

    //Update Supplier

    const updateSuppliers = useCallback((updateinfo) => {
        setUpdateMode(true);
        setSelectedSupplier(updateinfo);
    }, []);

    //Show Supplier Details

    const addOrder = useCallback(async (supplier) => {
        const { name, id, created_by } = supplier;
        try {
            const response = await fetch("/api/orders/new_order", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    supplier_id: id,
                    supplier_name: name,
                    created_by: created_by,
                })
            })
            if (!response.ok) {
                console.error("failed to create new order")
            }
            const data = await response.json()
            toast.success(data.message)
        }
        catch (error) {
            console.error("error creating new order", error)
        }



    }, [accessToken]);



    //USE EFFECT To render Table

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers, updateMode]);

    //Columns Defention for Table

    const columns = useMemo(() => [...suppliercols, {
        Header: 'Actions',
        Cell: ({ row }) => (
            <div className={styles.actionsContainer}>


                <button className={`${styles.actionButton} ${styles.delete}`} onClick={() => deleteSuppliers(row.original.id)}>Delete</button>

                <button className={`${styles.actionButton} ${styles.update}`} onClick={() => updateSuppliers(row.original)}>Update</button>

                <button className={`${styles.actionButton} ${styles.payment}`} onClick={() => addOrder(row.original)}>New Order</button>
            </div>
        )
    }], [deleteSuppliers, updateSuppliers, addOrder,]);

    //Data Defention for Table

    const data = useMemo(() => suppliers, [suppliers]);

    //Suppliers Table Instance 

    const tableInstance = useTable({
        columns: columns,
        data: data,
        initialState: {
            globalFilter: filters.globalFilter
        }
    }, useGlobalFilter, usePagination);

    //Condtionally render Create Suppliers Depending on updateMode

    if (updateMode) {
        return <CreateSupplier selectedSupplier={selectedSupplier} setUpdateMode={setUpdateMode} />;
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>Suppliers</header>
            <div className={styles.content}>
                <Globalfilter filters={filters} setFilters={setFilters} />
                <TableBody tableInstance={tableInstance} />
                <Pagination tableInstance={tableInstance} />

            </div>
        </div>
    );
}
