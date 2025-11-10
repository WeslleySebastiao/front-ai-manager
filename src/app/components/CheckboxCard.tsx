import React from 'react'

interface CheckboxCardProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void  // ✅ aqui definimos o tipo
}

export default function CheckboxCard({ label, checked, onChange }: CheckboxCardProps) {
  return (
    <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-300 dark:border-[#3b4354] bg-background-light dark:bg-[#101622] has-[:checked]:bg-primary/10 has-[:checked]:border-primary dark:has-[:checked]:bg-primary/20 dark:has-[:checked]:border-primary cursor-pointer transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)} // ✅ envia um booleano
        className="form-checkbox h-5 w-5 rounded text-primary bg-transparent border-gray-400 dark:border-[#5a6376] focus:ring-primary/50"
      />
      <span className="text-gray-700 dark:text-gray-200">{label}</span>
    </label>
  )
}
