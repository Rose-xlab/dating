const PrivacyPolicy = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Privacy Policy</h1>
          <p className="text-gray-600 mb-4">
            Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-gray-600 mb-4">
            We may collect personal information such as your name, email address, and chat history when you use our service. We also collect anonymized data for analytics.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="text-gray-600 mb-4">
            We use your information to provide and improve our services, to communicate with you, and to ensure the safety and security of our platform. We do not sell your personal data to third parties.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">3. Data Security</h2>
          <p className="text-gray-600 mb-4">
            We implement a variety of security measures to maintain the safety of your personal information. All chat data is encrypted and handled securely.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">4. Your Choices</h2>
          <p className="text-gray-600 mb-4">
            You can access and update your personal information through your account settings. You may also request the deletion of your account and associated data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

