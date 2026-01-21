import { motion } from "framer-motion";

export const Greeting = () => {
  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="font-semibold text-xl md:text-2xl"
        initial={{ opacity: 0, y: 10 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        Cosil Dispute Readiness Check
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-xl text-zinc-500 md:text-2xl"
        initial={{ opacity: 0, y: 10 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        A structured way to stabilise disputes, reduce escalation, and decide the right next step.
      </motion.div>

      <motion.ul
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.8 }}
        className="mt-6 space-y-2 text-zinc-600 text-base"
      >
        <li>• A complaint is escalating, what should we stabilise first?</li>
        <li>• Ombudsman pressure, what evidence should we pull together?</li>
        <li>• Is mediation appropriate right now, or is it too early?</li>
        <li>• Service charge dispute, how do we reduce risk and repetition?</li>
        <li>• Draft a calm, defensible response to a sensitive complaint</li>
      </motion.ul>
    </div>
  );
};
