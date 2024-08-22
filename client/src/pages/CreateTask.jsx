
import React from "react"
import styles from '../styles/forms.module.css'
import { useState, useEffect } from "react"
import { useAuth } from "../AuthContext"
import { useNavigate } from "react-router-dom"
import { toast } from 'react-toastify';
import { taskFormConfig } from '../config/formconfig'
import Form from "../componenets/Form"
import ClientSelect from "../componenets/ClientSelect"
import UserSelect from "../componenets/UserSelect"

export default function CreateTask({ selectedTask, setUpdateMode }) {
    const navigate = useNavigate();
    const { accessToken, user } = useAuth();
    const [formData, setFormData] = useState({
        task: "",
        client: "",
        details: "",
        deadline: "",
        assigned_to: "",

    });



    const handleInput = (name, value) => {

        setFormData({ ...formData, [name]: value })
    }


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let endpoint = '/api/tasks/create';
            let method = 'POST';
            if (selectedTask) {
                endpoint = `/api/tasks/update/${selectedTask.ref_number}`;
                method = "PUT";
            }

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'username': user.username
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            toast.success(data.message)

            navigate('/tasks');
            if (selectedTask) {
                setUpdateMode(false);
            }

        } catch (error) {
            console.error('Error', error);
        }
    };
    useEffect(() => {
        if (selectedTask) {

            setFormData({
                task: selectedTask.task || "",
                client: selectedTask.client || "",
                details: selectedTask.details || "",
                deadline: selectedTask.deadline || "",
                assigned_to: selectedTask.assigned_to || "",
                status: selectedTask.status || "",
                employee_comments: selectedTask.employee_comments || "",

            });
        }
    }, [selectedTask]);

    if (!user) {
        return <div>Loading...</div>;
    }


    return (
        <div className={styles.formBackground}>
            <div className={`container-fluid ${styles.customContainer}`}>
                <h2>{selectedTask ? "Update Task " : "Create New Task"}</h2>
                {
                    (user.privilege === 'admin' || user.privilege === 'manager') && (
                        <>
                            <Form
                                config={taskFormConfig}
                                formData={formData}
                                handleInput={handleInput}
                            />
                            <ClientSelect value={formData.client} onChange={(e) => handleInput(e.target.name, e.target.value)} />
                            <UserSelect value={formData.assigned_to} onChange={(e) => handleInput(e.target.name, e.target.value)} />
                        </>
                    )
                }


                {selectedTask && (
                    <>
                        <div className="form-group">
                            <label htmlFor="employee_comments">Employee Comments</label>
                            <textarea
                                id="employee_comments"
                                name="employee_comments"
                                value={formData.employee_comments}
                                onChange={(e) => handleInput(e.target.name, e.target.value)}
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="status">Status</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={(e) => handleInput(e.target.name, e.target.value)}
                                className="form-control"
                            >
                                <option value="">Select status</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>

                            </select>
                        </div>
                    </>
                )}

                <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    )
}