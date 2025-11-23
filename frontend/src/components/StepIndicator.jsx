import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const StepIndicator = ({ steps, currentStep }) => {
  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-brand-surface dark:bg-gray-800">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-primary to-brand-sky"
          initial={{ width: '100%' }}
          // animate={{
          //   width: `${((steps.findIndex(s => s.id === currentStep)) / (steps.length - 1)) * 100}%`
          // }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
          const isCurrent = step.id === currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center">
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted
                  ? 'bg-brand-primary border-brand-primary text-brand-white'
                  : isCurrent
                    ? 'bg-brand-white dark:bg-gray-900 border-brand-primary text-brand-primary'
                    : 'bg-brand-white dark:bg-gray-900 border-brand-surface dark:border-gray-700 text-brand-muted'
                  }`}
                whileHover={{ scale: 1.05 }}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-semibold">{step.id}</span>
                )}
              </motion.div>

              <div className="mt-2 text-center">
                <p
                  className={`text-sm font-medium ${isCurrent
                    ? 'text-brand-primary'
                    : 'text-brand-muted dark:text-gray-400'
                    }`}
                >
                  {step.name}
                </p>
                <p className="text-xs text-brand-muted dark:text-gray-500 hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
