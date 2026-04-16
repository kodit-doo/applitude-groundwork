export default function LeftPanel() {
  return (
    <div className="hidden lg:flex w-[45%] bg-[#1E2429] flex-col justify-between p-12 flex-shrink-0 h-full">
      <div />
      <div className="max-w-sm">
        <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
          Turn your idea into a product plan.
        </h1>
        <p className="text-gray-400 mt-5 text-base leading-relaxed">
          Answer questions with your AI guide. Get a professional Product
          Vision Document in 30 minutes.
        </p>
      </div>
      <div>
        <span className="text-white font-extrabold text-lg tracking-tight">
          Applitude
        </span>
      </div>
    </div>
  );
}
