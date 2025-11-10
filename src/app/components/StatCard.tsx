import React from 'react'

type Props = {
  title: string
  value: string | number
  children?: React.ReactNode
}

export default function StatCard({ title, value, children }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
      <p className="text-gray-600 dark:text-gray-400 text-base font-medium leading-normal">
        {title}
      </p>
      {children || (
        <p className="text-gray-900 dark:text-white tracking-tight text-4xl font-bold leading-tight">
          {value}
        </p>
      )}
    </div>
  )
}
