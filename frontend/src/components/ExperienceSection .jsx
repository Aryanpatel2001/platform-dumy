import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function ExperienceSection({
  label = "Call Center",
  title = "Connect your customers with an",
  highlight1 = "engaging",
  highlight2 = "satisfying",
  features = [],
  image = "/after_0.png",
  caption = "Real-time call metrics & recordings",
  reverse = false, // 🔄 NEW PROP — to switch sides
}) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div
        className={`grid md:grid-cols-2 gap-12 items-center ${
          reverse ? "md:[&>div:first-child]:order-2" : ""
        }`}
      >
        {/* Left / Right content */}
        <div>
          {label && (
            <span className="inline-block px-3 py-1 rounded-full bg-brand-light text-brand-primary text-xs font-semibold mb-4">
              {label}
            </span>
          )}
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6">
            {title}{" "}
            <span className="text-brand-secondary"> {highlight1}</span> and
            <span className="text-brand-primary"> {highlight2}</span> experience
          </h2>

          <ul className="space-y-3 text-brand-muted">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="w-2 h-2 rounded-full bg-brand-primary mr-3 mt-2"></span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Image / Visual */}
        <motion.div
          className="relative rounded-3xl overflow-hidden card p-0"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
        >
          <img
            src={image}
            alt={label || "Experience Image"}
            className="w-full h-full object-cover"
          />
          {caption && (
            <div className="absolute bottom-4 right-4 bg-brand-white/80 dark:bg-brand-dark/70 backdrop-blur-md rounded-xl px-4 py-2 shadow">
              <p className="text-sm font-medium text-brand-primary">{caption}</p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
