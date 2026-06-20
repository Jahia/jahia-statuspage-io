// Lightweight test doubles for the @jahia/moonstone components used by the panel.
import React from 'react';

export const Button = ({label, onClick, isDisabled, buttonRef, type = 'button'}) => (
    <button ref={buttonRef} type={type} disabled={isDisabled} onClick={onClick}>
        {label}
    </button>
);

export const Field = ({label, id, children}) => (
    <div>
        <label id={id}>{label}</label>
        {children}
    </div>
);

export const Input = ({inputRef, onChange, value, ...rest}) => (
    <input ref={inputRef} value={value} onChange={onChange} {...rest}/>
);
