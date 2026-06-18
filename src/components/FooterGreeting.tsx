import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FOOTER_GREETINGS } from '@/constants/teasers'

export function FooterGreeting() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % FOOTER_GREETINGS.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="fixed bottom-0 inset-x-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5 }}
          className="text-center text-xs sm:text-sm text-white/40 font-light max-w-md mx-auto"
        >
          {FOOTER_GREETINGS[index]}
        </motion.p>
      </AnimatePresence>
    </footer>
  )
}
