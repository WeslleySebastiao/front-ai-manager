import React from 'react'

export default function FormTextarea({ label, id, ...props }) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-gray-800 dark:text-white text-base font-medium pb-2">
        {label}
      </label>
      <textarea
        id={id}
        {...props}
        className="form-textarea w-full rounded-lg text-gray-800 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-[#3b4354] bg-background-light dark:bg-[#101622] focus:border-primary min-h-48 placeholder:text-gray-400 dark:placeholder:text-[#9da6b9] p-4 text-base"
      />
    </div>
  )
}
