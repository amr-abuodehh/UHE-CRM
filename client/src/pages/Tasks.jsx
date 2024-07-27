import React, { useCallback, useEffect, useMemo, useState } from "react";
import { taskColumns } from "../config/taskcolumns";
import { Globalfilter } from '../componenets/Globalfilter'; // Adjust path if needed
import TableBody from '../componenets/Tablebody'; // Adjust path if needed
import Pagination from '../componenets/Pagination'; // Adjust path if needed
import { useTable, useGlobalFilter, usePagination } from 'react-table';
import { useAuth } from "../AuthContext";
import styles from "../styles/pages.module.css";
import { toast } from 'react-toastify';
import CreateTask from './CreateTask';

export default function Clients() {
    const { accessToken, user } = useAuth();
    const [selectedTask, setSelectedTask] = useState([]);
    const [updateMode, setUpdateMode] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [filters, setFilters] = useState({
        globalFilter: "",
        location: "",
        startDate: "",
        endDate: "",
    });

    const fetchTasks = useCallback(async () => {
        if (!user) return;
        try {
            const { location, startDate, endDate } = filters;
            let url = `/api/tasks/fetch`;
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
                }
            });

            if (!response.ok) {
                throw new Error("Network response was not okay");
            }

            const data = await response.json();
            setTasks(data);
        } catch (error) {
            console.error("Error fetching tasks", error);
        }
    }, [filters, accessToken, user]);

    const deleteTask = useCallback(async (id) => {
        try {
            const response = await fetch(`/api/tasks/delete/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });
            if (!response.ok) {
                console.error("Network response was not okay");
            }

            const data = await response.json();
            toast.success(data.message);
            fetchTasks();
        } catch (error) {
            console.error("Error deleting task", error);
        }
    }, [fetchTasks, accessToken]);

    const updateTask = useCallback((task) => {
        setSelectedTask(task);
        setUpdateMode(true);
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks, updateMode]);

    const columns = useMemo(() => [
        ...taskColumns,
        {
            Header: 'Actions',
            Cell: ({ row }) => (
                <div className={styles.actionsContainer}>
                    {user.privilege === 'admin' || user.privilege === 'manager' ? (
                        <button
                            className={`${styles.actionButton} ${styles.delete}`}
                            onClick={() => deleteTask(row.original.id)}
                        >
                            Delete
                        </button>
                    ) : null}
                    <button
                        className={`${styles.actionButton} ${styles.update}`}
                        onClick={() => updateTask(row.original)}
                    >
                        Update
                    </button>
                </div>
            )
        }
    ], [deleteTask, updateTask, user]);

    const data = useMemo(() => tasks, [tasks]);

    const tableInstance = useTable({
        columns: columns,
        data: data,
        initialState: {
            globalFilter: filters.globalFilter
        }
    }, useGlobalFilter, usePagination);

    if (updateMode) {
        return <CreateTask selectedTask={selectedTask} setUpdateMode={setUpdateMode} />;
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>Tasks</header>
            <div className={styles.content}>
                <Globalfilter filters={filters} setFilters={setFilters} showLocationFilter={false} />
                <TableBody tableInstance={tableInstance} />
                <Pagination tableInstance={tableInstance} />
            </div>
        </div>
    );
}
