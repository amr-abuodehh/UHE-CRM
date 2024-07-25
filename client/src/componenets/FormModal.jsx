import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import styles from '../styles/modal.module.css';

const FormModal = ({ config, formData, handleInput, handleSubmit, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <Modal show={true} onHide={onClose} centered className={styles.customModal}>
            <Modal.Header closeButton>
                <Modal.Title>Add Payment</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <form onSubmit={handleSubmit}>
                    {config.map((field, index) => {
                        const { type, label, name, required } = field;
                        return (
                            <div className="form-group" key={index}>
                                <label htmlFor={name}>{label}</label>
                                <input
                                    type={type}
                                    className="form-control"
                                    id={name}
                                    name={name}
                                    value={formData[name]}
                                    onChange={(e) => handleInput(name, e.target.value)}
                                    required={required}
                                />
                            </div>
                        );
                    })}
                    <Button variant="primary" type="submit">
                        Submit
                    </Button>
                </form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default FormModal;
