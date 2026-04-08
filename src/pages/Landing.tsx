import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { HeartIcon, MessageCircleIcon, MapPinIcon } from '@/components/ui/Icons'

const features = [
  {
    icon: HeartIcon,
    title: 'Свайпай!',
    desc: 'Находи людей, которые тебе нравятся',
  },
  {
    icon: MessageCircleIcon,
    title: 'Общайся!',
    desc: 'Пиши тем, кто понравился тебе в ответ',
  },
  {
    icon: MapPinIcon,
    title: 'Встречайся!',
    desc: 'Назначай встречи и общайся вживую',
  },
]

const floatingShapes = [
  { x: '10%', y: '15%', size: 60, delay: 0, color: 'rgba(66,133,244,0.08)' },
  { x: '80%', y: '10%', size: 80, delay: 0.3, color: 'rgba(234,67,53,0.07)' },
  { x: '85%', y: '55%', size: 50, delay: 0.6, color: 'rgba(107,202,171,0.1)' },
  { x: '5%', y: '60%', size: 70, delay: 0.2, color: 'rgba(66,133,244,0.06)' },
  { x: '50%', y: '5%', size: 40, delay: 0.5, color: 'rgba(234,67,53,0.06)' },
  { x: '30%', y: '8%', size: 35, delay: 0.15, color: 'rgba(255,193,7,0.08)' },
  { x: '70%', y: '3%', size: 45, delay: 0.35, color: 'rgba(107,202,171,0.07)' },
  { x: '15%', y: '2%', size: 30, delay: 0.55, color: 'rgba(156,39,176,0.06)' },
  { x: '60%', y: '12%', size: 50, delay: 0.25, color: 'rgba(66,133,244,0.07)' },
  { x: '20%', y: '80%', size: 55, delay: 0.4, color: 'rgba(107,202,171,0.08)' },
  { x: '65%', y: '70%', size: 65, delay: 0.7, color: 'rgba(255,193,7,0.07)' },
  { x: '35%', y: '40%', size: 45, delay: 0.1, color: 'rgba(156,39,176,0.05)' },
  { x: '92%', y: '35%', size: 55, delay: 0.8, color: 'rgba(255,152,0,0.06)' },
  { x: '40%', y: '90%', size: 50, delay: 0.5, color: 'rgba(66,133,244,0.06)' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
}

export default function Landing() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasProfile = useAuthStore((s) => s.hasProfile)

  const handleStart = () => {
    if (isAuthenticated && hasProfile) {
      navigate('/discover')
    } else {
      useAuthStore.getState().logout()
      navigate('/auth')
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#fafafa] overflow-hidden relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(255,249,230,0.45) 0%, transparent 70%)',
        }}
      />

      {floatingShapes.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: shape.x,
            top: shape.y,
            width: shape.size,
            height: shape.size,
            backgroundColor: shape.color,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -15, 0, 15, 0],
          }}
          transition={{
            opacity: { duration: 0.4, delay: shape.delay },
            scale: { duration: 0.4, delay: shape.delay },
            y: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: shape.delay },
          }}
        />
      ))}

      <section className="min-h-[82dvh] flex items-center justify-center px-4 relative z-10">
        <motion.div
          className="text-center max-w-2xl w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-3 sm:mb-4">
            <h1
              className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight text-neutral-900"
              style={{ lineHeight: 1.1 }}
            >
              T-Match
            </h1>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-800 mb-3 sm:mb-4"
          >
            Найди свою половинку
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-neutral-500 mb-8 sm:mb-10 max-w-md mx-auto"
          >
            Знакомства рядом с тобой
          </motion.p>

          <motion.div variants={itemVariants}>
            <motion.div
              className="inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                onClick={handleStart}
                className="shadow-[0_4px_24px_rgba(255,193,7,0.4)] hover:shadow-[0_6px_32px_rgba(255,193,7,0.55)] transition-shadow duration-300 !px-12 !py-4 !text-lg"
              >
                Начать
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-16 sm:pb-20 relative z-10">
        <motion.div
          className="text-center mb-10 sm:mb-12"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">Как это работает?</h3>
          <p className="text-neutral-400 text-sm sm:text-base">Три простых шага к новым знакомствам</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-7">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="bg-white rounded-2xl p-7 sm:p-8 text-center shadow-sm hover:shadow-md transition-shadow duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
            >
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-7 h-7 text-brand-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 relative z-10">
        <p className="text-neutral-400 text-xs mb-1">
          T-Match {new Date().getFullYear()}
        </p>
        <p className="text-neutral-300 text-xs tracking-wide">
          404-й легион совместно с Т-Банк
        </p>
      </footer>
    </div>
  )
}
