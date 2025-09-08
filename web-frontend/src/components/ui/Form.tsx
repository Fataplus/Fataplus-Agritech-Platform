import React from 'react';
import { useForm, UseFormReturn, FieldPath, FieldValues, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import Input, { InputProps } from './Input';
import Button from './Button';

// Form Field Component
export interface FormFieldProps<TFieldValues extends FieldValues = FieldValues> {
  name: FieldPath<TFieldValues>;
  label?: string;
  description?: string;
  children: React.ReactNode;
}

function FormField<TFieldValues extends FieldValues = FieldValues>({
  name,
  label,
  description,
  children,
}: FormFieldProps<TFieldValues>) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {children}
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}

// Form Input Component
export interface FormInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<InputProps, 'form'> {
  name: FieldPath<TFieldValues>;
  form: UseFormReturn<TFieldValues>;
}

function FormInput<TFieldValues extends FieldValues = FieldValues>({
  name,
  form,
  ...props
}: FormInputProps<TFieldValues>) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Input
      {...register(name)}
      error={errors[name]?.message as string}
      {...props}
    />
  );
}

// Form Provider Component
export interface FormProps<TFieldValues extends FieldValues = FieldValues> {
  form: UseFormReturn<TFieldValues>;
  onSubmit: (values: TFieldValues) => void | Promise<void>;
  className?: string;
  children: React.ReactNode;
}

function Form<TFieldValues extends FieldValues = FieldValues>({
  form,
  onSubmit,
  className,
  children,
}: FormProps<TFieldValues>) {
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn('space-y-6', className)}
    >
      {children}
    </form>
  );
}

// Hook for creating forms with validation
export function useFormWithValidation<T extends z.ZodSchema>(
  schema: T,
  defaultValues?: Partial<z.infer<T>>
) {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as z.infer<T>,
  });
}

// Form Actions Component
export interface FormActionsProps {
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  className?: string;
}

function FormActions({
  isSubmitting = false,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  className,
}: FormActionsProps) {
  return (
    <div className={cn('flex justify-end gap-3', className)}>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        {submitLabel}
      </Button>
    </div>
  );
}

// Export all form components
export { Form, FormField, FormInput, FormActions };

// Re-export react-hook-form utilities for convenience
export { Controller } from 'react-hook-form';
