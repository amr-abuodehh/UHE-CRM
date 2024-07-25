import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import styles from '../styles/modal.module.css';

const UploadModal = ({ isOpen, onClose, uploadedFiles, onFileChange, onFileUpload, file, handleDelete, path }) => {
    if (!isOpen) return null;

    return (
        <Modal show={true} onHide={onClose} centered className={styles.customModal}>
            <Modal.Header closeButton>
                <Modal.Title>View Receipts</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {uploadedFiles.length === 0 ? (
                    <p>No files uploaded</p>
                ) : (
                    <ul className={styles.fileList}>
                        {uploadedFiles.map((file, index) => (
                            <li key={index} className={styles.fileItem}>
                                <a
                                    href={`http://localhost:5000/uploads/${path}/${encodeURIComponent(file.file_name)}`}
                                    download
                                    rel="noopener noreferrer"
                                    className={styles.fileLink}
                                >
                                    {file.file_name}
                                </a>
                                <button
                                    className={styles.deleteButton}
                                    onClick={() => handleDelete(file.id, file.file_url)}
                                >
                                    X
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <div className={styles.uploadSection}>
                    <input type="file" onChange={onFileChange} />
                    <Button onClick={onFileUpload} disabled={!file}>
                        Upload File
                    </Button>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default UploadModal;
