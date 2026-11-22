import React from 'react';

interface EmpeoLogoProps {
  subtitle?: string;
  size?: 'sm' | 'md';
  inverted?: boolean;
}

export const EmpeoLogo: React.FC<EmpeoLogoProps> = ({
  subtitle,
  size = 'md',
  inverted = false,
}) => {
  const iconSize = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';
  const textSize = size === 'sm' ? 'text-lg' : 'text-[22px]';

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Authentic empeo two-people mark */}
      <svg
        viewBox="0 0 36 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconSize} shrink-0`}
        aria-hidden="true"
      >
        <circle cx="12.5" cy="7.5" r="4.5" fill={inverted ? '#FFFFFF' : '#EE5D36'} />
        <path
          d="M4 23.5C4 18.8056 7.80558 15 12.5 15C17.1944 15 21 18.8056 21 23.5V25H4V23.5Z"
          fill={inverted ? '#FFFFFF' : '#EE5D36'}
        />
        <circle cx="24.5" cy="9.5" r="3.5" fill={inverted ? '#FFD6CA' : '#F4815F'} />
        <path
          d="M19.5 25V23.2C19.5 19.6 21.8 16.7 25 16.7C28.4 16.7 31 19.3 31 22.8V25H19.5Z"
          fill={inverted ? '#FFD6CA' : '#F4815F'}
        />
      </svg>

      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`${textSize} font-extrabold tracking-tight ${
              inverted ? 'text-white' : 'text-[#EE5D36]'
            }`}
          >
            empeo
          </span>
          {subtitle && (
            <span
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                inverted
                  ? 'bg-white/15 text-white/90'
                  : 'bg-[#FFF3EF] text-[#EE5D36]'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

