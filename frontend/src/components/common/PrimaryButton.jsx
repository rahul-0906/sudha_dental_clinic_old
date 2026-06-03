import React from 'react';
import PropTypes from 'prop-types';

export default function PrimaryButton({
  children,
  onClick,
  icon: Icon,
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
  ...props
}) {
  const baseStyle = "flex items-center justify-center gap-2 h-10 px-4 py-2 font-medium text-sm rounded-xl whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out";
  
  const variantStyles = variant === 'secondary'
    ? "bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 focus:ring-slate-400"
    : "bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white focus:ring-teal-500";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyle}
        ${variantStyles}
        disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {Icon && (
        <Icon 
          size={18} 
          strokeWidth={1.5} 
          className="flex-shrink-0" 
        />
      )}
      <span>{children}</span>
    </button>
  );
}

PrimaryButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  icon: PropTypes.elementType,
  variant: PropTypes.oneOf(['primary', 'secondary']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled: PropTypes.bool,
  className: PropTypes.string,
};
