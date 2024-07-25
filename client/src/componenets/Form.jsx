import React from 'react';

const Form = ({ config, formData, handleInput, handleSubmit }) => {
    return (
        <form onSubmit={handleSubmit}>
            {config.map((field, index) => {
                const { type, label, name, required, options, rows, step } = field;
                switch (type) {
                    case 'text':
                    case 'email':
                    case 'password':
                    case 'tel':
                    case 'number':
                    case 'date':
                    case 'time':
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
                                    step={step}
                                />
                            </div>
                        );
                    case 'textarea':
                        return (
                            <div className="form-group" key={index}>
                                <label htmlFor={name}>{label}</label>
                                <textarea
                                    className="form-control"
                                    id={name}
                                    name={name}
                                    rows={rows || 3}
                                    value={formData[name]}
                                    onChange={(e) => handleInput(name, e.target.value)}
                                    required={required}
                                ></textarea>
                            </div>
                        );
                    case 'select':
                        return (
                            <div className="form-group" key={index}>
                                <label htmlFor={name}>{label}</label>
                                <select
                                    className="form-control"
                                    id={name}
                                    name={name}
                                    value={formData[name]}
                                    onChange={(e) => handleInput(name, e.target.value)}
                                    required={required}
                                >
                                    <option value="">Select...</option>
                                    {options.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );
                    default:
                        return null;
                }
            })}

        </form>
    );
};

export default Form;
