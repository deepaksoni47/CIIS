export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          🏛️ Campus Infrastructure Intelligence System
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Powered by Google Cloud & Gemini AI
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </a>
          <a
            href="/map"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            View Heatmap
          </a>
        </div>
      </div>
    </main>
  );
}
