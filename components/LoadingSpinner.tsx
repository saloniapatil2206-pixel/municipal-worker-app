export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-14 w-14' }[size]
  return (
    <div className="flex items-center justify-center w-full py-12">
      <div className={`${sizeClass} animate-spin rounded-full border-4 border-gray-200 border-t-[#0F4C81]`} />
    </div>
  )
}
