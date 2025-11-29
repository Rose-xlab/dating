const AboutUs = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">About Us</h1>
          <p className="text-gray-600 mb-4 text-lg">
            We are a team of developers and safety experts dedicated to making online dating a safer experience for everyone.
          </p>
          <p className="text-gray-600 mb-8">
            Our mission is to empower users with the tools and knowledge to identify red flags, avoid scams, and build healthier connections. We believe that everyone deserves to feel secure while seeking meaningful relationships online.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-12 mb-6">Our Team</h2>
          <div className="flex justify-center items-center space-x-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-800">Jane Doe</h3>
              <p className="text-gray-500">Founder & CEO</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-800">John Smith</h3>
              <p className="text-gray-500">Lead Safety Analyst</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;

