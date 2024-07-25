// components/Globalfilter.js

import React from 'react';
import dayjs from 'dayjs';
import styles from '../styles/filters.module.css';

export const Globalfilter = ({ filters, setFilters, showLocationFilter = true }) => {
    const handleStartDateChange = (e) => {
        const inputDate = dayjs(e.target.value).format('YYYY-MM-DD');
        setFilters({ ...filters, startDate: inputDate });
        console.log('Formatted Start Date:', inputDate);
    };

    const handleEndDateChange = (e) => {
        const inputDate = dayjs(e.target.value).format('YYYY-MM-DD');
        setFilters({ ...filters, endDate: inputDate });
        console.log('Formatted End Date:', inputDate);
    };

    return (
        <div className={styles.filtercontainer}>
            <span>
                <label htmlFor="globalFilter">Search:</label>
                <input
                    id="globalFilter"
                    type="text"
                    value={filters.globalFilter}
                    onChange={(e) => setFilters({ ...filters, globalFilter: e.target.value })}
                    className={styles.inputField}
                />
            </span>
            {showLocationFilter && (
                <span>
                    <label htmlFor="locationFilter">Location:</label>
                    <select
                        id="locationFilter"
                        value={filters.location}
                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                        className={styles.selectField}
                    >
                        <option value=""></option>
                        <option value="Abu Dhabi">Abu Dhabi</option>
                        <option value="AL-Ain">AL-Ain</option>
                        <option value="AL-Sharja">AL-Sharja</option>
                        <option value="Dubai">Dubai</option>
                        <option value="Ajman">Ajman</option>
                        <option value="Ras AL Khayma">Ras AL Khayma</option>
                        <option value="Umm Al Quwain">Umm Al Quwain</option>
                    </select>
                </span>
            )}
            <span>
                <label htmlFor="startDate">Date:</label>
                <input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={handleStartDateChange}
                    className={styles.inputField}
                />
                {'  --   '}
                <input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={handleEndDateChange}
                    className={styles.inputField}
                />
            </span>
        </div>
    );
};
