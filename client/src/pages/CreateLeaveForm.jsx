import { useNavigate } from 'react-router-dom';
import styles from '../styles/forms.module.css';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { toast } from 'react-toastify';
import Form from '../componenets/Form';
import { leaveFormConfig } from '../config/formconfig'

export default function CreateLeaveFrom({ selectedForm, setUpdateMode }) {
    const [formData, setFormData] = useState({
        name: "", designation: "", employee_number: "", joining_date: "", department: "", start_date: "", return_date: "", number_of_days: "", type_of_leave: "",
    });
    const { accessToken, user } = useAuth();
    const navigate = useNavigate();

    //Submit for both Create and Update

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let endpoint = '/api/hr/create_leave';
            let method = 'POST';
            if (selectedForm) {
                endpoint = `/api/hr/update_leave/${selectedForm.ref_number}`;
                method = "PUT";
            }

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                    'username': user.username
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            toast.success(data.message)

            navigate('/leave_forms');
            if (selectedForm) {
                setUpdateMode(false);
            }


        } catch (error) {
            console.error('Error', error);
        }
    };

    //Setting Form Data

    const handleInput = (name, value) => {

        setFormData({ ...formData, [name]: value });
    };

    //USE EFFECT populate form With Existing Supplier info in Update mode

    useEffect(() => {
        if (selectedForm) {
            setFormData({
                name: selectedForm.name || "",
                designation: selectedForm.designation || "",
                employee_number: selectedForm.employee_number || "",
                joining_date: selectedForm.joining_date || "",
                department: selectedForm.department || "",
                start_date: selectedForm.start_date || "",
                return_date: selectedForm.return_date || "",
                type_of_leave: selectedForm.type_of_leave || "",
                number_of_days: selectedForm.number_of_days || "",
                leave_balance: selectedForm.leave_balance || "",
                manager_approval: selectedForm.manager_approval || "",
                hr_approval: selectedForm.hr_approval || "",
                comments: selectedForm.comments || "",

            });
        }
    }, [selectedForm]);

    return (
        <div className={styles.formBackground}>
            <div className={`container-fluid ${styles.customContainer}`}>
                <h2>{selectedForm ? "Update Leave Form" : "Create Leave Form"}</h2>
                {console.log(selectedForm)}
                <Form
                    config={leaveFormConfig}
                    formData={formData}
                    handleInput={handleInput}
                />
                {selectedForm && (
                    <>
                        <div className="form-group">
                            <label htmlFor="leave_balance">Leave Balance</label>
                            <input
                                type="text"
                                className="form-control"
                                id="leave_balance"
                                name="leave_balance"
                                value={formData.leave_balance}
                                onChange={(e) => handleInput(e.target.name, e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="manager_approval">Manager Approval</label>
                            <select
                                className="form-control"
                                id="manager_approval"
                                name="manager_approval"
                                value={formData.manager_approval}
                                onChange={(e) => handleInput(e.target.name, e.target.value)}
                                required
                            >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="disapproved">Disapproved</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="hr_approval">HR Approval</label>
                            <select
                                className="form-control"
                                id="hr_approval"
                                name="hr_approval"
                                value={formData.hr_approval}
                                onChange={(e) => handleInput(e.target.name, e.target.value)}
                                required
                            >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="disapproved">Disapproved</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="comments">Comments</label>
                            <input
                                type="text"
                                className="form-control"
                                id="comments"
                                name="comments"
                                value={formData.comments}
                                onChange={(e) => handleInput(e.target.name, e.target.value)}
                                required
                            />
                        </div>
                    </>
                )}


                <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    );
}
