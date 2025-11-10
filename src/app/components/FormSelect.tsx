import React from 'react'

interface FormSelectProps {
  id: string
  name: string
  label: string
  options: string[]  // ✅ aqui é o segredo!
}

export default function FormSelect({ id, name, label, options }: FormSelectProps) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-gray-800 dark:text-white text-base font-medium pb-2">
        {label}
      </label>
      <select
        id={id}
        name={name}
        className="form-select w-full rounded-lg text-gray-800 dark:text-white border border-gray-300 dark:border-[#3b4354] bg-background-light dark:bg-[#101622] focus:outline-0 focus:ring-2 focus:ring-primary/50 focus:border-primary h-12 px-4 text-base"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}
