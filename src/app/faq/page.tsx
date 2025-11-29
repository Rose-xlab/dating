const FAQ = () => {
  const faqs = [
    {
      question: "How does the chat analysis work?",
      answer: "Our AI analyzes conversation patterns, language, and behavior to identify potential red flags, such as love bombing, financial requests, and inconsistencies. It provides a risk score and detailed report to help you make informed decisions."
    },
    {
      question: "Is my data private and secure?",
      answer: "Yes, protecting your privacy is our top priority. All chat data is anonymized and encrypted. We do not share your personal information with third parties. You have full control over your data and can delete it at any time."
    },
    {
      question: "What kind of red flags can the AI detect?",
      answer: "Our AI is trained to detect a wide range of red flags, including emotional manipulation, guilt-tripping, love bombing, financial scam indicators, urgency pressure, boundary violations, and suspicious behavior patterns."
    },
    {
      question: "Can I use this for any dating app?",
      answer: "Yes, you can upload screenshots from any dating app or messaging platform. Our OCR technology extracts the conversation for analysis, regardless of the app's user interface."
    }
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Frequently Asked Questions</h1>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{faq.question}</h2>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;

