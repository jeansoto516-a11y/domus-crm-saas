import React from 'react';

/**
 * Converte o texto digitado em numero.
 * Aceita: 450.000,50 | 450000,5 | 450000 | 450.5
 * Regra: com virgula, a virgula e o decimal e os pontos sao milhar.
 * Sem virgula, um ponto seguido de exatamente 3 digitos e tratado como milhar (1.500 = 1500).
 */
export function parseMoney(text) {
    if (text === null || text === undefined) return null;

    let s = String(text).trim().replace(/[^\d.,]/g, '');
    if (!s) return null;

    if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
    } else if (s.includes('.')) {
    const parts = s.split('.');
    const first = parts[0];
    const looksLikeThousands =
        first.length >= 1 &&
        first.length <= 3 &&
        first !== '0' &&
        parts.slice(1).every((part) => part.length === 3);

    s = looksLikeThousands
        ? parts.join('')
        : `${parts.slice(0, -1).join('')}.${parts[parts.length - 1]}`;
    }

    const number = Number(s);
    return Number.isNaN(number) ? null : number;
}

export function formatMoneyInput(value) {
    const number = typeof value === 'number' ? value : parseMoney(value);

    if (number === null || number === undefined || Number.isNaN(number)) return '';

    return number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
    });
}

function MoneyInput({ name, value, onChange, className = 'dd-input', placeholder, disabled }) {
    const emit = (newValue) => {
    if (onChange) onChange({ target: { name, value: newValue } });
    };

    const handleChange = (event) => {
    emit(event.target.value.replace(/[^\d.,]/g, ''));
    };

    const handleBlur = () => {
    const parsed = parseMoney(value);
    emit(parsed === null ? '' : formatMoneyInput(parsed));
    };

    return (
    <input
        className={className}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        name={name}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleChange}
        onBlur={handleBlur}
    />
    );
}

export default MoneyInput;