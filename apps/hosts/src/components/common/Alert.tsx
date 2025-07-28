/* eslint-disable no-unused-vars */
export enum AlertVariant {
    Info = 'info',
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
}
interface IAlert {
    variant?: AlertVariant;
    title: string;
}

export default function Alert(props: Readonly<IAlert>) {
    const { variant = 'info', title } = props;
    const variantClasses: Record<string, string> = {
        info: 'alert-info',
        success: 'alert-success',
        warning: 'alert-warning',
        error: 'alert-error',
    };

    const alertClass = variantClasses[variant];

    return (
        <div role="alert" className={`alert ${alertClass} alert-outline`}>
            <span>{title}</span>
        </div>
    );
}
