export default function LeftPanel() {
  return (
    <div className="bg-white p-6 h-full">
      <div className="max-w-sm">
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
          How to Use
        </h2>
        
        {/* Separator line */}
        <div className="w-full h-0.5 bg-blue-900 mb-6"></div>
        
        {/* Instructions list */}
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed">
              Enter the URL of the recipe you want to extract
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">2</span>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed">
              Click the "Extract Recipe" button
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">3</span>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed">
              The recipe ingredients and instructions will be extracted and displayed
            </p>
          </div>
          
          {/* Step 4 */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">4</span>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed">
              You can print the recipe
            </p>
          </div>
          
          {/* Step 5 */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">5</span>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed">
              Bon Appetit!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}