'use client';

import React, { useState, useEffect } from 'react';
import { inter } from '../fonts';
import { useAuth, AuthContextType } from '@/context/AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { OrbField } from '../components/gradients/OrbField';
import PulseButton from '../components/buttons/PulseButton';

// Define the questionnaire sections
const SECTIONS = [
  {
    id: 'lifestyle',
    title: 'Lifestyle & Career',
    questions: [
      { id: 'career', text: 'What is your current career field?', type: 'text' },
      { id: 'workLifeBalance', text: 'How important is work-life balance to you?', type: 'scale', min: 1, max: 5, minLabel: 'Not important', maxLabel: 'Very important' },
      { id: 'ambition', text: 'How ambitious are you in your career?', type: 'scale', min: 1, max: 5, minLabel: 'Not ambitious', maxLabel: 'Very ambitious' },
      { id: 'travel', text: 'How often do you like to travel?', type: 'select', options: ['Rarely', 'A few times a year', 'Monthly', 'As much as possible'] },
      { id: 'socialLife', text: 'How would you describe your social life?', type: 'select', options: ['Very quiet/private', 'Small circle of friends', 'Balanced', 'Very active/outgoing'] },
      { id: 'hobbies', text: 'What are your main hobbies or interests?', type: 'text' },
      { id: 'exercise', text: 'How important is physical fitness to you?', type: 'scale', min: 1, max: 5, minLabel: 'Not important', maxLabel: 'Very important' },
    ]
  },
  {
    id: 'relationships',
    title: 'Values & Goals',
    questions: [
      { id: 'commitment', text: 'What type of relationship are you looking for?', type: 'select', options: ['Casual dating', 'Serious but taking it slow', 'Committed relationship', 'Marriage-minded'] },
      { id: 'children', text: 'Do you want children?', type: 'select', options: ['Definitely no', 'Probably no', 'Undecided', 'Probably yes', 'Definitely yes', 'Already have children and want more', 'Already have children and don\'t want more'] },
      { id: 'familyValues', text: 'How important are family values to you?', type: 'scale', min: 1, max: 5, minLabel: 'Not important', maxLabel: 'Very important' },
      { id: 'religion', text: 'How important is religion/spirituality in your life?', type: 'scale', min: 1, max: 5, minLabel: 'Not important', maxLabel: 'Very important' },
      { id: 'finances', text: 'How do you prefer to handle finances in a relationship?', type: 'select', options: ['Completely separate', 'Mostly separate with shared expenses', 'Completely shared/joint'] },
      { id: 'livingArrangement', text: 'What is your ideal living arrangement with a partner?', type: 'select', options: ['Living separately', 'Living together but with personal space', 'Fully shared living space'] },
    ]
  },
  {
    id: 'personality',
    title: 'Emotional Intelligence',
    questions: [
      { id: 'introExtro', text: 'Do you consider yourself more of an introvert or extrovert?', type: 'scale', min: 1, max: 5, minLabel: 'Complete introvert', maxLabel: 'Complete extrovert' },
      { id: 'conflict', text: 'How do you typically handle conflict?', type: 'select', options: ['Avoid it', 'Address it calmly', 'Need time to process first', 'Direct confrontation'] },
      { id: 'communication', text: 'How would you describe your communication style?', type: 'select', options: ['Reserved/private', 'Selective sharing', 'Open and direct', 'Very expressive'] },
      { id: 'stress', text: 'How do you typically handle stress?', type: 'select', options: ['Need alone time', 'Talk it through with others', 'Physical activity', 'Creative outlets', 'Meditation/mindfulness'] },
      { id: 'decision', text: 'How do you typically make important decisions?', type: 'select', options: ['Logical/analytical', 'Based on feelings', 'Consult others', 'Mix of logic and intuition'] },
      { id: 'humor', text: 'How would you describe your sense of humor?', type: 'select', options: ['Dry/sarcastic', 'Silly/goofy', 'Dark/edgy', 'Witty/clever', 'Playful teasing'] },
    ]
  },
  {
    id: 'loveLanguage',
    title: 'Love Language',
    questions: [
      { id: 'giveAffection', text: 'How do you prefer to show affection?', type: 'select', options: ['Physical touch', 'Words of affirmation', 'Acts of service', 'Quality time', 'Giving gifts'] },
      { id: 'receiveAffection', text: 'How do you prefer to receive affection?', type: 'select', options: ['Physical touch', 'Words of affirmation', 'Acts of service', 'Quality time', 'Receiving gifts'] },
      { id: 'publicAffection', text: 'How comfortable are you with public displays of affection?', type: 'scale', min: 1, max: 5, minLabel: 'Not comfortable', maxLabel: 'Very comfortable' },
      { id: 'romance', text: 'How important is romance to you?', type: 'scale', min: 1, max: 5, minLabel: 'Not important', maxLabel: 'Very important' },
      { id: 'surprises', text: 'How do you feel about surprises?', type: 'select', options: ['Strongly dislike', 'Slightly uncomfortable', 'Neutral', 'Enjoy them', 'Love them'] },
    ]
  },
  {
    id: 'attraction',
    title: 'Attraction',
    questions: [
      { id: 'physicalAttraction', text: 'How important is physical attraction to you in a relationship?', type: 'scale', min: 1, max: 5, minLabel: 'Not important', maxLabel: 'Very important' },
      { id: 'height', text: 'Do you have preferences regarding your partner\'s height?', type: 'select', options: ['No preference', 'Taller than me', 'Shorter than me', 'About the same height'] },
      { id: 'bodyType', text: 'Do you have preferences regarding body type?', type: 'select', options: ['No preference', 'Slim/athletic', 'Average', 'Curvy/full-figured', 'Muscular'] },
      { id: 'style', text: 'What type of personal style do you find most attractive?', type: 'select', options: ['Casual/relaxed', 'Professional/polished', 'Alternative/unique', 'Fashionable/trendy', 'No preference'] },
      { id: 'grooming', text: 'How important is personal grooming to you?', type: 'scale', min: 1, max: 5, minLabel: 'Not important', maxLabel: 'Very important' },
    ]
  },
  {
    id: 'intimacy',
    title: 'Intimacy',
    questions: [
      { id: 'sexImportance', text: 'How important is sexual compatibility in a relationship?', type: 'scale', min: 1, max: 5, minLabel: 'Not important', maxLabel: 'Very important' },
      { id: 'sexFrequency', text: 'What is your ideal frequency of sexual intimacy?', type: 'select', options: ['Daily', 'Several times a week', 'Weekly', 'A few times a month', 'Monthly or less'] },
      { id: 'sexOpenness', text: 'How open are you to trying new things sexually?', type: 'scale', min: 1, max: 5, minLabel: 'Not open', maxLabel: 'Very open' },
      { id: 'sexCommunication', text: 'How comfortable are you discussing sexual preferences?', type: 'scale', min: 1, max: 5, minLabel: 'Not comfortable', maxLabel: 'Very comfortable' },
      { id: 'nonSexualIntimacy', text: 'How important is non-sexual physical intimacy to you?', type: 'scale', min: 1, max: 5, minLabel: 'Not important', maxLabel: 'Very important' },
    ]
  },
  {
    id: 'dealBreakers',
    title: 'Deal-Breakers',
    questions: [
      { id: 'smoking', text: 'How do you feel about smoking?', type: 'select', options: ['Deal-breaker', 'Prefer non-smoker', 'Occasional is ok', 'Don\'t mind', 'I smoke'] },
      { id: 'drinking', text: 'How do you feel about drinking alcohol?', type: 'select', options: ['Deal-breaker', 'Prefer non-drinker', 'Occasional is ok', 'Social drinking is ok', 'I drink regularly'] },
      { id: 'politics', text: 'How important is political compatibility?', type: 'scale', min: 1, max: 5, minLabel: 'Not important', maxLabel: 'Very important' },
      { id: 'distance', text: 'What is the maximum distance you\'re willing to travel for a relationship?', type: 'select', options: ['Same neighborhood', 'Same city', 'Within 1 hour', 'Within a few hours', 'Long distance is ok'] },
      { id: 'pets', text: 'How do you feel about pets?', type: 'select', options: ['Don\'t want pets', 'Some pets are ok', 'Love pets', 'Have pets that are important to me'] },
      { id: 'otherDealBreakers', text: 'Are there any other absolute deal-breakers for you?', type: 'text' },
    ]
  }
];

// Maximum questions per page
const MAX_QUESTIONS_PER_PAGE = 5;

export default function Questionnaire() {
  const auth: AuthContextType = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            // If user already has questionnaire answers, load them
            if (data.questionnaireAnswers) {
              setAnswers(data.questionnaireAnswers);
            }
            if (data.completedSections) {
              setCompletedSections(data.completedSections);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, [auth.currentUser]);

  useEffect(() => {
    // Calculate overall progress
    const totalQuestions = SECTIONS.reduce((acc, section) => acc + section.questions.length, 0);
    const answeredQuestions = Object.keys(answers).length;
    const calculatedProgress = Math.round((answeredQuestions / totalQuestions) * 100);
    setProgress(calculatedProgress);
    
    // Check which sections are complete
    const completed: Record<string, boolean> = {};
    SECTIONS.forEach(section => {
      const sectionQuestions = section.questions.map(q => `${section.id}_${q.id}`);
      const answeredSectionQuestions = sectionQuestions.filter(id => answers[id] !== undefined);
      completed[section.id] = answeredSectionQuestions.length === sectionQuestions.length;
    });
    setCompletedSections(completed);
  }, [answers]);

  const currentSectionData = SECTIONS[currentSection];
  
  // Calculate total pages for current section
  const totalPagesInSection = Math.ceil(currentSectionData.questions.length / MAX_QUESTIONS_PER_PAGE);
  
  // Get questions for current page
  const startIdx = currentPage * MAX_QUESTIONS_PER_PAGE;
  const endIdx = Math.min(startIdx + MAX_QUESTIONS_PER_PAGE, currentSectionData.questions.length);
  const currentQuestions = currentSectionData.questions.slice(startIdx, endIdx);

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [`${currentSectionData.id}_${questionId}`]: value
    }));
  };

  const handleNext = async () => {
    // Save progress
    await saveProgress();
    
    // If there are more pages in this section
    if (currentPage < totalPagesInSection - 1) {
      setCurrentPage(currentPage + 1);
    } 
    // If there are more sections
    else if (currentSection < SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentPage(0);
    } 
    // If completed all sections
    else {
      // Final save and redirect
      await saveProgress(true);
      router.push('/dashboard');
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      // Set to last page of previous section
      const prevSectionPages = Math.ceil(SECTIONS[currentSection - 1].questions.length / MAX_QUESTIONS_PER_PAGE);
      setCurrentPage(prevSectionPages - 1);
    }
  };

  const saveProgress = async (isComplete = false) => {
    if (!auth.currentUser) return;
    
    setSaving(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        questionnaireAnswers: answers,
        completedSections: completedSections,
        questionnaireCompleted: isComplete,
        questionnaireLastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving questionnaire progress:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderQuestion = (question: any) => {
    const answerId = `${currentSectionData.id}_${question.id}`;
    const currentAnswer = answers[answerId] || '';

    switch (question.type) {
      case 'text':
        return (
          <div className="mb-6">
            <label className={`block text-white mb-6 ${inter.className}`}>{question.text}</label>
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              className={`w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 ${inter.className}`}
            />
          </div>
        );
      
      case 'select':
        return (
          <div className="mb-6">
            <label className={`block text-white mb-6 ${inter.className}`}>{question.text}</label>
            <div className="flex flex-wrap gap-3 mt-6">
              {question.options.map((option: string) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(question.id, option)}
                  className={`w-48 whitespace-nowrap px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-200 text-center ${inter.className} ${
                    currentAnswer === option
                      ? 'bg-[#73FFF6] text-purple-900 border border-[#73FFF6]'
                      : 'bg-purple-500/30 text-white border border-white/50 hover:bg-purple-500/40'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      
      case 'scale':
        return (
          <div className="mb-6">
            <label className={`block text-white mb-6 ${inter.className}`}>{question.text}</label>
            <div className="flex flex-col space-y-2">
              <div className={`flex justify-between text-white/70 text-sm ${inter.className}`}>
                <span>{question.minLabel}</span>
                <span>{question.maxLabel}</span>
              </div>
              <div className="flex items-center space-x-2">
                {Array.from({ length: question.max - question.min + 1 }).map((_, idx) => {
                  const value = question.min + idx;
                  return (
                    <button
                      key={value}
                      onClick={() => handleAnswer(question.id, value)}
                      className={`flex-1 h-10 rounded-md transition-colors ${inter.className} ${
                        currentAnswer === value
                          ? 'bg-[#73FFF6] text-purple-900'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-900 flex flex-col">
        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden flex flex-col lg:flex-row">
          {/* Background Elements */}
          <div className="absolute inset-0">
            {/* Background Gradient - removing white/light colors */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900" />
            <div className="absolute inset-0">
              <OrbField />
            </div>
            {/* Add large purple orb in the sidebar area */}
            <div className="absolute top-0 left-0 lg:w-64 xl:w-72 h-full overflow-hidden pointer-events-none">
              <div className="absolute -left-1/2 top-1/2 w-[500px] h-[500px] rounded-full opacity-70 blur-[60px]" 
                style={{
                  background: 'radial-gradient(circle, rgba(88, 28, 135, 0.9) 0%, rgba(88, 28, 135, 0.6) 40%, rgba(88, 28, 135, 0.3) 80%)',
                  transform: 'translateY(-50%)',
                }}>
              </div>
            </div>
          </div>
          {/* Sidebar for loading state */}
          <div className="relative z-10 w-full lg:w-64 xl:w-72 bg-transparent backdrop-blur-md border-r border-blue-100/30 overflow-y-auto hidden lg:block">
            <div className="p-6">
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <Image
                  src="/vettly-logo.png"
                  alt="Vettly Logo"
                  width={150}
                  height={40}
                  className="h-auto w-auto sm:w-[120px] w-[160px] mb-6"
                  priority
                />
              </div>
              {/* Loading indicator for sidebar */}
              <div className="flex justify-center mt-8">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
          {/* Loading Content */}
          <div className="relative z-10 min-h-screen flex items-center justify-center">
            <div className="p-8 rounded-lg bg-white/30 backdrop-blur-md">
              <div className="flex flex-col items-center">
                <Image
                  src="/vettly-logo.png"
                  alt="Vettly Logo"
                  width={200}
                  height={60}
                  className="h-auto w-auto sm:w-[160px] w-[200px] mb-6"
                  priority
                />
                <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-cyan-900 font-medium">Loading your questionnaire...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900 flex flex-col">
      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col lg:flex-row">
        {/* Background Elements */}
        <div className="absolute inset-0">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900" />
          <div className="absolute inset-0">
            <OrbField />
          </div>
            {/* Add large purple orb in the sidebar area */}
            <div className="absolute top-0 left-0 lg:w-64 xl:w-72 h-full overflow-hidden pointer-events-none">
              <div className="absolute -left-1/2 top-1/2 w-[500px] h-[500px] rounded-full opacity-70 blur-[60px]" 
                style={{
                  background: 'radial-gradient(circle, rgba(88, 28, 135, 0.9) 0%, rgba(88, 28, 135, 0.6) 40%, rgba(88, 28, 135, 0.3) 80%)',
                  transform: 'translateY(-50%)',
                }}>
              </div>
            </div>
        </div>

        {/* Sidebar */}
        <div className="relative z-20 w-full lg:w-64 xl:w-72 bg-transparent backdrop-blur-md border-r border-blue-100/30 overflow-y-auto hidden lg:block">
          <div className="p-6">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Image
                src="/vettly-logo.png"
                alt="Vettly Logo"
                width={120}
                height={32}
                className="h-auto w-auto"
                priority
              />
            </div>
            
            {/* Section Navigation */}
            <div className="space-y-1">
              {SECTIONS.map((section, index) => {
                const isComplete = completedSections[section.id];
                const isActive = currentSection === index;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setCurrentSection(index);
                      setCurrentPage(0);
                    }}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-all duration-200 ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                        isComplete 
                          ? 'bg-[#5EFAD7] border-[#5EFAD7]' 
                          : isActive 
                            ? 'bg-white/20 border-white/40' 
                            : 'bg-white/10 border-white/20'
                      }`}>
                        {isComplete && (
                          <svg className="w-3 h-3 text-[#4A1D96]" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${inter.className} text-white`}>{section.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="relative flex-1 z-10 p-4 md:p-8 flex flex-col justify-center overflow-y-auto pb-20 lg:pb-0">
          <div className="h-full flex flex-col justify-center">
            {/* Mobile Header with Logo */}
            <div className="flex flex-col items-center mb-8 lg:hidden">
              <Image
                src="/vettly-logo.png"
                alt="Vettly Logo"
                width={120}
                height={32}
                className="h-auto w-auto sm:w-[120px] w-[150px]"
                priority
              />
              <p className="text-[#73FFF6] tracking-[0.25em] text-xs font-light mt-4">
                POWERED BY PEOPLE, PERFECTED BY TECH
              </p>
            </div>

            {/* Back Button - Mobile */}
            <div className="flex justify-start mb-4 px-4 lg:hidden">
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-white hover:text-purple-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-7xl mx-auto px-4 md:px-8 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl text-white">Your Progress</h3>
                  <span className="text-purple-400 text-sm">
                    {currentSection + 1} <span className="mx-1">of</span> {SECTIONS.length}
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#73FFF6] to-[#4A1D96]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Questionnaire Content */}
            <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border-2 border-white/20 mb-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <h3 className="text-3xl md:text-4xl text-white font-bold">{currentSectionData.title}</h3>
                  </div>
                  <div className="text-white text-sm">
                    Page {currentPage + 1} <span className="mx-1">of</span> {totalPagesInSection}
                  </div>
                </div>
                {/* Questions - 2 Column Layout for Desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
                  {currentQuestions.map((question) => (
                    <div key={question.id} className="p-4 md:p-6 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 transition-all duration-300 border border-white/20">
                      {renderQuestion(question)}
                    </div>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-4 mt-8">
                  <PulseButton
                    onClick={handlePrevious}
                    disabled={saving}
                    className="!bg-white/10 !text-white hover:!bg-white/20 !py-2 !px-4 md:!py-3 md:!px-20"
                  >
                    Previous
                  </PulseButton>
                  <PulseButton
                    onClick={handleNext}
                    disabled={saving}
                    className="!bg-[#73FFF6] !py-2 !px-4 md:!py-3 md:!px-20"
                    style={{color: "#4A1D96"}}
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-purple-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span style={{color: "#4A1D96"}}>Saving...</span>
                      </>
                    ) : currentSection === SECTIONS.length - 1 && currentPage === totalPagesInSection - 1 ? (
                      <span style={{color: "#4A1D96"}}>Complete</span>
                    ) : (
                      <span style={{color: "#4A1D96"}}>Next</span>
                    )}
                  </PulseButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-purple-500/30 backdrop-blur-md border-t border-white/20 z-20 lg:hidden">
        <div className="overflow-x-auto py-3 px-4">
          <div className="flex space-x-3 min-w-max">
            {SECTIONS.map((section, index) => {
              const isComplete = completedSections[section.id];
              const isActive = currentSection === index;
              
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setCurrentSection(index);
                    setCurrentPage(0);
                  }}
                  className={`px-3 py-2 rounded-lg flex flex-col items-center justify-center transition-all duration-200 min-w-[80px] ${
                    isActive 
                      ? 'bg-purple-500/40 text-white' 
                      : 'text-white hover:bg-purple-500/30'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                    isComplete 
                      ? 'bg-[#5EFAD7] border-[#5EFAD7]' 
                      : isActive 
                        ? 'bg-white/20 border-white' 
                        : 'bg-white/10 border-white/50'
                  }`}>
                    {isComplete && (
                      <svg className="w-3 h-3 text-[#4A1D96]" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm ${inter.className}`}>{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
