import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from "../AuthContext";
import { toast } from 'react-toastify';
import UploadModal from "./UploadModal";

const UploadQuotationFiles = ({ isOpen, onClose, quotationId }) => {
    const { accessToken } = useAuth();
    const [file, setFile] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState([]);

    const fetchUploadedFiles = useCallback(async () => {
        if (quotationId) {
            try {
                const response = await fetch(`/api/quotations/fetch_files/${quotationId}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                setUploadedFiles(data.files);
            } catch (error) {
                console.error('Error fetching files:', error);
            }
        }
    }, [quotationId, accessToken]);

    useEffect(() => {
        fetchUploadedFiles();
    }, [fetchUploadedFiles]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };
    const handleDelete = useCallback(async (id, file_url) => {
        try {
            const response = await fetch(`/api/quotations/delete_files/${id}/${encodeURIComponent(file_url)}`, {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();
            toast.success(data.message);
            fetchUploadedFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
            toast.error('Failed to delete file: ' + error.message);
        }
    }, [accessToken, fetchUploadedFiles]);

    const handleFileUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('quotationId', quotationId);

        try {
            const response = await fetch(`/api/quotations/upload_receipt`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Network response was not ok');
            }

            setFile(null);
            toast.success(data.message || 'File uploaded successfully!');
            fetchUploadedFiles(); // Refresh the files list after upload
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Failed to upload file: ' + error.message);
        }
    };

    return (
        <UploadModal
            isOpen={isOpen}
            onClose={onClose}
            uploadedFiles={uploadedFiles}
            onFileChange={handleFileChange}
            onFileUpload={handleFileUpload}
            file={file}
            handleDelete={handleDelete}
            path={'quotationReceipts'}
        />
    );
};

export default UploadQuotationFiles;
