import React, { useCallback, useEffect, useMemo, useState } from "react";
import { clientcolumns } from "../config/clientcolumns";
import { Globalfilter } from '../componenets/Globalfilter';
import TableBody from '../componenets/Tablebody';
import Pagination from '../componenets/Pagination';
import { useTable, useGlobalFilter, usePagination } from 'react-table';
import { useAuth } from "../AuthContext";
import styles from "../styles/pages.module.css"
import { toast } from 'react-toastify';
import CreateClients from './CreateClients'


export default function Clients() {
    const { accessToken } = useAuth();
    const [selectedClient, setSelectedClient] = useState([])
    const [updateMode, setUpdateMode] = useState(false)
    const [clients, setClients] = useState([]);
    const [filters, setFilters] = useState({
        globalFilter: "",
        location: "",
        startDate: "",
        endDate: "",
    });


    const fetchClients = useCallback(async () => {
        try {
            const { location, startDate, endDate } = filters;
            let url = `/api/clients/fetch`;
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
            setClients(data);
            console.log(data)
        } catch (error) {
            console.error("Error fetching clients", error);
        }
    }, [filters, accessToken]);


    const deleteClient = useCallback(async (id) => {
        try {
            const response = await fetch(`/api/clients/delete/${id}`, {
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


            fetchClients()
        }
        catch (error) {
            console.error("error deleting supplier", error)
        }

    }, [fetchClients, accessToken])

    const updateClient = useCallback((client) => {
        setSelectedClient(client)
        setUpdateMode(true)
    }, [])


    const addQuatation = useCallback(async (client) => {
        const { name, ref_number, created_by } = client;

        try {
            const response = await fetch("/api/quotations/create_quotation", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    client_id: ref_number,
                    client_name: name,
                    created_by: created_by,
                })
            })

            if (!response.ok) {
                console.error("Netwrok response was not ok")
            }

            const data = await response.json();
            toast.success(data.message)
        }
        catch (error) {
            console.error("Error adding quotation", error)
            toast.error("Error adding quotation Contact IT")
        }

    }, [accessToken])





    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const columns = useMemo(() => [...clientcolumns, {
        Header: 'Actions',
        Cell: ({ row }) => (
            <div className={styles.actionsContainer}>
                <button className={`${styles.actionButton} ${styles.delete}`} onClick={() => deleteClient(row.original.ref_number)}>Delete</button>
                <button className={`${styles.actionButton} ${styles.update}`} onClick={() => updateClient(row.original)}>Update</button>
                <button className={`${styles.actionButton} ${styles.payment}`} onClick={() => addQuatation(row.original)}>Add Quatation</button>

            </div>
        )
    }], [deleteClient, updateClient, addQuatation]);

    const data = useMemo(() => clients, [clients]);

    const tableInstance = useTable({
        columns: columns,
        data: data,
        initialState: {
            globalFilter: filters.globalFilter
        }
    }, useGlobalFilter, usePagination);

    if (updateMode) {
        return <CreateClients selectedClient={selectedClient} setUpdateMode={setUpdateMode} />
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>Clients</header>
            <div className={styles.content}>
                <Globalfilter filters={filters} setFilters={setFilters} />
                <TableBody tableInstance={tableInstance} />
                <Pagination tableInstance={tableInstance} />

            </div>
        </div>
    );
}
