import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const withAuth = (WrappedComponent) => (props) => {
    const { accessToken, loading } = useAuth();

    if (loading) {

        return <div>Loading...</div>;
    }

    return accessToken ? <WrappedComponent {...props} /> : <Navigate to="/" replace />;
};

export default withAuth;
