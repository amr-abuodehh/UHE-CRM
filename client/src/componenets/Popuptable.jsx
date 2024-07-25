import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import TableBody from './Tablebody';
import styles from '../styles/modal.module.css';

export const Popuptable = ({ handleClose, tableInstance }) => {
    return (
        <Modal show={true} onHide={handleClose} centered className={styles.customModal}>
            <Modal.Header closeButton>
                <Modal.Title>Payment Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <TableBody tableInstance={tableInstance} />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};
