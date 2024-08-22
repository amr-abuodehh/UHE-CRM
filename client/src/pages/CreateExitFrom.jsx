import { useNavigate } from 'react-router-dom';
import styles from '../styles/forms.module.css';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { toast } from 'react-toastify';
import Form from '../componenets/Form';
import { exitFormConfig } from '../config/formconfig'

export default function CreateExitFrom({ selectedForm, setUpdateMode }) {
    const [formData, setFormData] = useState({
        name: "", designation: "", department: "", from_time: "", to_time: "", reason: "",
    });
    const { accessToken, user } = useAuth();
    const navigate = useNavigate();

    //Submit for both Create and Update

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let endpoint = '/api/hr/create';
            let method = 'POST';
            if (selectedForm) {
                endpoint = `/api/hr/update/${selectedForm.ref_number}`;
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

            navigate('/exit_forms');
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
                department: selectedForm.department || "",
                from_time: selectedForm.from_time || "",
                to_time: selectedForm.to_time || "",
                reason: selectedForm.reason || "",
                hr_acknowledgment_date: selectedForm.hr_acknowledgment_date || "",
                hr_approval: selectedForm.hr_approval || "",
            });
        }
    }, [selectedForm]);

    return (
        <div className={styles.formBackground}>
            <div className={`container-fluid ${styles.customContainer}`}>
                <h2>{selectedForm ? "Update Exit Form" : "Create Exit Form"}</h2>
                <Form
                    config={exitFormConfig}
                    formData={formData}
                    handleInput={handleInput}
                />
                {selectedForm && (
                    <>
                        <div className="form-group">
                            <label htmlFor="hr_acknowledgment_date">Manager Acknowledgment Date</label>
                            <input
                                type="date"
                                className="form-control"
                                id="hr_acknowledgment_date"
                                name="hr_acknowledgment_date"
                                value={formData.hr_acknowledgment_date}
                                onChange={(e) => handleInput(e.target.name, e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="hr_approval">Manager Approval</label>
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
                            <label htmlFor="remarks">Remarks</label>
                            <input
                                type="text"
                                className="form-control"
                                id="remarks"
                                name="remarks"
                                value={formData.remarks}
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
