import { exitFormColumns } from '../config/exitformcolumns';
import styles from '../styles/pages.module.css';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTable, useGlobalFilter, usePagination } from 'react-table';
import { Globalfilter } from '../componenets/Globalfilter';
import TableBody from '../componenets/Tablebody';
import CreateExitFrom from '../pages/CreateExitFrom';
import Pagination from '../componenets/Pagination';
import { useAuth } from '../AuthContext';
import { toast } from 'react-toastify';


export default function ExitForms() {

    const { accessToken, user } = useAuth();
    const [exitForms, setExitForms] = useState([]);
    const [filters, setFilters] = useState({
        globalFilter: "",
        location: "",
        startDate: "",
        endDate: "",
    });
    const [updateMode, setUpdateMode] = useState(false);
    const [selectedForm, setSelectedForm] = useState([]);


    //fetch Suppliers and pass Filters

    const fetchExitForms = useCallback(async () => {
        if (!user) return;
        try {
            const { location, startDate, endDate } = filters;
            let url = '/api/hr/fetch';
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
                    'User': JSON.stringify(user)
                },
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            setExitForms(data);
        } catch (error) {
            console.error('Error fetching forms:', error);
        }
    }, [filters, accessToken, user]);

    //Supplier table Action buttons

    //Delete Suppliers by ID
    const deleteForm = useCallback(async (id) => {
        try {
            const response = await fetch(`/api/hr/delete/${id}`, {
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
            fetchExitForms();
        } catch (error) {
            console.error('Error Deleting form', error);
        }
    }, [fetchExitForms, accessToken]);

    //Update Supplier

    const updateForm = useCallback((updateinfo) => {
        setUpdateMode(true);
        setSelectedForm(updateinfo);
    }, []);

    //USE EFFECT To render Table

    useEffect(() => {
        fetchExitForms();
    }, [fetchExitForms, updateMode]);

    //Columns Defention for Table

    const columns = useMemo(() => {
        const cols = [...exitFormColumns];
        if (user && (user.privilege === 'admin' || user.privilege === 'manager')) {
            cols.push({
                Header: 'Actions',
                Cell: ({ row }) => (
                    <div className={styles.actionsContainer}>
                        <button className={`${styles.actionButton} ${styles.delete}`} onClick={() => deleteForm(row.original.ref_number)}>Delete</button>
                        <button className={`${styles.actionButton} ${styles.update}`} onClick={() => updateForm(row.original)}>Update</button>
                    </div>
                )
            });
        }
        return cols;
    }, [deleteForm, updateForm, user]);

    //Data Defention for Table

    const data = useMemo(() => exitForms, [exitForms]);

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
        return <CreateExitFrom selectedForm={selectedForm} setUpdateMode={setUpdateMode} />;
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>Exit Forms</header>
            <div className={styles.content}>
                <Globalfilter filters={filters} setFilters={setFilters} showLocationFilter={false} />
                <TableBody tableInstance={tableInstance} />
                <Pagination tableInstance={tableInstance} />

            </div>
        </div>
    );
}