import { motion } from 'framer-motion';
import { Phone, Play, ShieldCheck, Zap, Globe2, Globe, AlertCircle, ChartBar, Layers, Cpu, MessageSquare, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import ExperienceSection from '../components/ExperienceSection ';
import SiteHeader from '../components/SiteHeader';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 }
};

const Landing = () => {
  return (
    <div className="min-h-screen bg-brand-white dark:bg-brand-dark">
      <SiteHeader />
      {/* Hero */}
      <section className="gradient-bg relative overflow-hidden">
        <div className="container max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.6 }}>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-brand-white dark:text-brand-white">
                Voice AI Agents Designed for Real Conversations
              </h1>
              <p className="mt-4 text-brand-white/90 max-w-xl">
                Automate customer calls across telephone, mobile apps, and web — with natural, intelligent conversations that truly sound human.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#demo" className="btn-primary inline-flex items-center">
                  <Phone className="w-5 h-5 mr-2" /> Call Now
                </a>
                <Link to="/register" className="btn-secondary">Contact Sales</Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="relative mx-auto w-full max-w-md">
                {/* Main glowing orb with floating effect */}
                <motion.div
                  className="aspect-square rounded-full  from-brand-light via-brand-sky to-brand-primary "
                  animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 3, -3, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Soft floating glows with shimmer */}
                <motion.div
                  className="absolute -top-6 left-10 w-24 h-24 bg-brand-light/30 blur-2xl rounded-full"
                  animate={{
                    x: [0, 10, -10, 0],
                    opacity: [0.5, 0.8, 0.6, 0.5],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <motion.div
                  className="absolute bottom-10 -right-6 w-20 h-20 bg-brand-accent/20 blur-2xl rounded-full"
                  animate={{
                    y: [0, -15, 0],
                    opacity: [0.4, 0.6, 0.4],
                  }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Background Image + Subtle Hover Glow */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-center bg-no-repeat bg-contain"
                  style={{ backgroundImage: "url('/download.png')" }}
                  animate={{
                    scale: [1, 1.03, 1],
                    filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <motion.button
                    whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(255,255,255,0.7)" }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-3 ml-6 rounded-full bg-brand-white/90 text-brand-primary font-semibold shadow-md flex items-center transition-all duration-300"
                  >
                    <Phone className="w-5 h-5 mr-2" /> Call Now
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section
        id="demo"
        className="container mx-auto  py-20 relative flex flex-col items-center"
      >
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          No More Press 1, Press 2…
        </h2>
        <p className="text-center text-brand-muted mb-16">
          Experience conversational Voice AI built to handle real-world workflows
        </p>

        <div className=' bg-slate-100 rounded-[20px] mx-auto w-full max-w-7xl'>
          <motion.div
            initial={{ scale: 0.9 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative flex items-center justify-center gap-4 h-24">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-20 bg-brand-light rounded-full origin-center "
                  animate={{
                    scaleY: [0.4, 0.9, 0.5, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 1 + i * 0.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            {/* Background Shape */}
            <img
              src="/phn-shape.svg"
              className="w-[400px] max-w-[480px] mr-6 ml-6"
              alt="voice icon"
            />
            <div className="relative flex items-center justify-center gap-4 h-24">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-20 bg-brand-light rounded-full origin-center "
                  animate={{
                    scaleY: [0.4, 0.9, 0.5, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 1 + i * 0.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            {/* Circle Container (static) */}
            <div className="absolute h-48 w-48 flex items-center justify-center rounded-full shadow-[0_0_40px_rgba(52,86,157,0.6)]">
              {/* Rotating Gradient Background */}
              <div className="absolute inset-0 rounded-full animate-gradient-spin bg-[conic-gradient(from_0deg,theme(colors.brand.primary),theme(colors.brand.accent),theme(colors.brand.secondary),theme(colors.brand.primary))]" />
              {/* Center-anchored music bars inside the orb */}
              <div className="relative flex items-center justify-center gap-3 h-24">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-16 bg-white rounded-full origin-center shadow-[0_0_10px_rgba(255,255,255,0.7)]"
                    animate={{
                      scaleY: [0.4, 0.9, 0.5, 0.8, 0.4],
                    }}
                    transition={{
                      duration: 1 + i * 0.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating Use Case Cards */}
        {[
          { title: "Lead Qualification", top: "220px", left: "360px", img: "/Icon.svg" },
          { title: "Product Recommendation", top: "250px", right: "200px", img: "/Icon (1).svg" },
          { title: "Bookings and Appointments", bottom: "80px", left: "320px", img: "/Icon (2).svg" },
          { title: "Customer Support", bottom: "90px", right: "200px", img: "/Icon (3).svg" },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ y: 10, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            className="absolute w-auto bg-white shadow-lg rounded-2xl px-5 py-3 flex items-center gap-3"
            style={{ ...item }}
          >
            <img src={item.img} className="w-7 h-7" />
            <div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-sm text-brand-muted">Play demo</p>
            </div>
            <button className="ml-4 inline-flex items-center px-3 py-1 rounded-full bg-brand-light text-brand-primary text-sm">
              <Play className="w-4 h-4 mr-1" /> Play
            </button>
          </motion.div>
        ))}
      </section>

      {/* Capabilities */}
      <section id="features" className=" max-w-7xl mx-auto px-6 py-16">
        <motion.h2 className="text-2xl md:text-3xl font-bold text-center mb-10" variants={fadeUp} initial="hidden" whileInView="show">
          Supercharge Customer Experiences with AI Voice Agent
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Align Voice Agent with Brand Personality */}
          <motion.div className="relative rounded-3xl overflow-hidden text-center p-0 bg-[#ebecec]" variants={fadeUp} initial="hidden" whileInView="show">
            <div className=" dark:bg-brand-dark/70 backdrop-blur-md rounded-xl p-4 ">
              <h3 className="text-xl font-bold mb-1">Align Voice Agent with Brand Personality</h3>
              <p className="text-sm text-brand-muted max-w-md">
                Select tone, gender, accent, and voice depth to fit your brand. Choose from warm, energetic, or calm styles that resonate with customers.
              </p>
            </div>
            <img src="/o1.webp" alt="Align Voice Agent" className="max-w-full  mt-5 " />
          </motion.div>

          {/* Break the Language Barrier */}
          <motion.div className="relative rounded-3xl overflow-hidden text-center p-0 bg-pink-50" variants={fadeUp} initial="hidden" whileInView="show">
            <div className=" dark:bg-brand-dark/70 backdrop-blur-md rounded-xl p-4 ">
              <h3 className="text-xl font-bold mb-1">Break the Language Barrier</h3>
              <p className="text-sm text-brand-muted ">
                Support for 100+ languages and dialects so customers can converse comfortably in their preferred language.
              </p>
            </div>
            <img src="/o5.webp" alt="Break the Language Barrier" className="max-w-full  mt-5 " />
          </motion.div>

          {/* Take Voice Conversations to the Next Level */}
          <motion.div className="relative rounded-3xl overflow-hidden  p-0" variants={fadeUp} initial="hidden" whileInView="show">
            <img src="/o3.png" alt="Next Level Conversations" className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 bg-brand-white/80 dark:bg-brand-dark/70 backdrop-blur-md rounded-xl p-4 shadow">
              <h3 className="text-xl font-bold mb-1">Take Voice Conversations to the Next Level</h3>
              <p className="text-sm text-brand-muted max-w-md">
                Real-time AI agents manage nuanced, branching conversations with empathy — no scripts required.
              </p>
            </div>
          </motion.div>

          {/* Launch Fast. Learn Faster. */}
          <motion.div className="relative rounded-3xl overflow-hidden  p-0" variants={fadeUp} initial="hidden" whileInView="show">
            <img src="/o4.png" alt="Launch Fast Learn Faster" className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 bg-brand-white/80 dark:bg-brand-dark/70 backdrop-blur-md rounded-xl p-4 shadow">
              <h3 className="text-xl font-bold mb-1">Launch Fast. Learn Faster.</h3>
              <p className="text-sm text-brand-muted max-w-md">
                Actionable analytics for sentiment, adherence, and satisfaction help you improve service and meet SLAs quickly.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
      <ExperienceSection
        label="Call Center"
        title="Connect your customers with an"
        highlight1="engaging"
        highlight2="satisfying"
        features={[
          "More flexibility, more significant savings and higher efficiency",
          "Safe, reliable, and high concurrency",
          "Flexible IVR process configuration",
          "Suitable for inbound and outbound calling",
        ]}
        image="/after_0.png"
        caption="Real-time call metrics & recordings"
      />

      <ExperienceSection
        label="Live Chat"
        title="Provide a seamless and interactive live chat experience for your customers."
        highlight1="real-time"
        highlight2="support "
        features={[
          "Improve the conversational experience and increase the customer retention rate for online businesses",
          "Reliable and fast chat with a range of features",
          "Customer information, quick reply, knowledge base supported online communication",
        ]}
        image="/after_1.png"
        caption="Real-time chat metrics & recordings"
        reverse={true}
      />

      <ExperienceSection
        label="Quality Inspection"
        title="Visually optimize the"
        highlight1="agent-customer"
        highlight2="interaction"
        features={[
          "Continuously measure and monitor agent performance",
          "Automatically detect customer emotions through the change of tone and volume, language use.",
          "Improve agent efficiency and customer satisfaction",
        ]}
        image="/after_3.png"
        caption="Quality inspection metrics & recordings"
      />
    </div>
  );
};

export default Landing;