const TermsOfService = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Terms of Service</h1>
          <p className="text-gray-600 mb-4">
            Welcome to our dating safety platform. By using our services, you agree to these terms. Please read them carefully.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">1. Your Account</h2>
          <p className="text-gray-600 mb-4">
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">2. User Conduct</h2>
          <p className="text-gray-600 mb-4">
            You agree not to use the service to:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>Upload or share any content that is unlawful, harmful, or threatening.</li>
            <li>Impersonate any person or entity.</li>
            <li>Harass, stalk, or otherwise violate the legal rights of others.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">3. Disclaimer of Warranties</h2>
          <p className="text-gray-600 mb-4">
            Our service is provided "as is" without any warranties of any kind. We do not guarantee the accuracy, completeness, or safety of any information on our platform.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">4. Limitation of Liability</h2>
          <p className="text-gray-600 mb-4">
            In no event shall our company be liable for any indirect, incidental, or consequential damages arising out of your use of the service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

