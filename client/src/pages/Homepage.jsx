import React, { useCallback, useEffect, useState } from "react";
import styles from '../styles/homepage.module.css';
import { useAuth } from "../AuthContext";

export default function Homepage() {
    const { accessToken, user } = useAuth();
    const [pendingQuotations, setPendingQuotations] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [taskInfo, setTaskInfo] = useState({ pending: 0, finished: 0 });

    const fetchPendingQuotations = useCallback(async () => {
        try {
            const response = await fetch('/api/home/fetch_pending_quotations', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            });
            if (!response.ok) {
                console.error("network response was not ok");
            }
            const data = await response.json();
            setPendingQuotations(data);
        } catch (error) {
            console.error('error fetching pending quotations', error);
        }
    }, [accessToken]);

    const fetchPendingOrders = useCallback(async () => {
        try {
            const response = await fetch('/api/home/fetch_pending_orders', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            });
            if (!response.ok) {
                console.error("network response was not ok");
            }
            const data = await response.json();
            setPendingOrders(data);
        } catch (error) {
            console.error('error fetching pending orders', error);
        }
    }, [accessToken]);

    const fetchTaskInfo = useCallback(async () => {
        try {
            const response = await fetch('/api/home/fetch_task_info', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Username': user.username,
                }
            });
            if (!response.ok) {
                console.error("network response was not ok");
            }
            const data = await response.json();
            setTaskInfo(data);
        } catch (error) {
            console.error('error fetching tasks', error);
        }
    }, [accessToken, user]);

    useEffect(() => {
        if (user) {
            fetchPendingQuotations();
            fetchPendingOrders();
            fetchTaskInfo();
        }
    }, [user, fetchPendingQuotations, fetchPendingOrders, fetchTaskInfo]);

    if (!user) {
        return <div>Loading....</div>;
    }

    const isAdmin = user.privilege === 'admin' || user.privilege === 'manager';

    return (
        <div className={styles.homepageContainer}>
            <h1 className={styles.welcomeMessage}>Welcome, {user.username}</h1>
            <div className={styles.cardsContainer}>
                {isAdmin && (
                    <>
                        <div className={styles.card}>
                            <h2>Pending Quotations</h2>
                            <p>{pendingQuotations.length}</p>
                        </div>
                        <div className={styles.card}>
                            <h2>Pending Orders</h2>
                            <p>{pendingOrders.length}</p>
                        </div>
                    </>
                )}
                {!isAdmin && (
                    <>
                        <div className={styles.card}>
                            <h2>Completed Tasks</h2>
                            <p>{taskInfo.finished}</p>
                        </div>
                        <div className={styles.card}>
                            <h2>Pending Tasks</h2>
                            <p>{taskInfo.pending}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
