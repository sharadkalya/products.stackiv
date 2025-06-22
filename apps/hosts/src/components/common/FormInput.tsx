'use client';
import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

type FormInputProps = {
    label: string;
    error?: string;
    placeholder?: string;
    type?: string;
    register: UseFormRegisterReturn;
};

const FormInput = ({ label, error, placeholder, type = 'text', register }: FormInputProps) => (
    <div className="flex flex-col space-y-1">
        <label className="label">
            <span className="label-text">{label}</span>
        </label>
        <input
            {...register}
            type={type}
            className={`input w-full ${error ? 'input-error' : ''}`}
            placeholder={placeholder}
        />
        {error && <span className="text-error text-sm">{error}</span>}
    </div>
);

export default FormInput;
