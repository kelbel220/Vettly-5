'use client';

import React, { useState, useEffect } from 'react';
import { inter, playfair } from '../fonts';
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
      { id: 'alcohol', text: 'How often do you consume alcohol?', type: 'select', options: ['Never', 'Occasionally (e.g., special occasions or a few times a year)', 'Socially (e.g., on weekends or with friends)', 'Regularly (e.g., most weeks)', 'Daily or almost daily'] },
      { id: 'alcoholPartner', text: 'Would you be happy with a partner who drinks more or less than you?', type: 'select', options: ['Yes, as long as it\'s respectful', 'Prefer someone with similar habits', 'No, I\'d prefer someone who drinks about the same amount as me'] },
      { id: 'smoking', text: 'Do you currently smoke cigarettes or vape?', type: 'select', options: ['No, and I never have', 'No, but I used to', 'Occasionally (socially or on rare occasions)', 'Yes, I vape', 'Yes, I smoke', 'Yes, I smoke and vape'] },

      { id: 'drugs', text: 'Do you currently use any recreational drugs (e.g., marijuana, party drugs, prescription misuse)?', type: 'select', options: ['No, I don\'t use any recreational drugs', 'Occasionally in social settings', 'Yes, regularly (e.g., weekly or more)'] },

      { id: 'drugEnvironment', text: 'Are you comfortable in social environments where drugs may be present (e.g., parties, festivals)?', type: 'select', options: ['Yes, I\'m comfortable', 'I\'ll go but prefer not to be around it', 'No, I avoid those settings'] },
      { id: 'activityLevel', text: 'Which best describes your weekly activity level?', type: 'select', options: ['Not currently active', 'Lightly active (e.g., casual walks or stretching)', 'Moderately active (e.g., gym or fitness 2–3 times a week)', 'Very active (e.g., daily workouts, sport, or training)'] },
      { id: 'partnerActivity', text: 'What\'s your ideal level of activity in a partner?', type: 'select', options: ['I\'d prefer someone more active than me', 'I\'d like someone with a similar lifestyle', 'I\'m happy if they\'re less active than me'] },
      { id: 'healthApproach', text: 'How would you describe your approach to health and wellness?', type: 'select', options: ['I don\'t prioritise it at the moment', 'I try to be mindful but not strict', 'I make conscious decisions most of the time', 'Health is a top priority in my daily life'] },
      { id: 'travelFrequency', text: 'How often do you currently travel (domestically or internationally)?', type: 'select', options: ['Rarely or never', 'Once or twice a year', 'Every few months', 'Frequently (monthly or more)'] },
      { id: 'travelFlexibility', text: 'How flexible is your schedule when it comes to spontaneous travel?', type: 'select', options: ['Not at all – my schedule is fixed', 'Somewhat flexible – I can plan in advance', 'Very flexible – I can leave with short notice'] },
      { id: 'maxTravelDistance', text: 'How far would you be willing to travel to meet a potential match?', type: 'select', options: ['Up to 10 km', '10-25 km', '25-50 km', '50-100 km', 'Over 100 km', 'Distance is not a factor for me'] },
      { id: 'relocation', text: 'Would you consider relocating for the right person or relationship?', type: 'select', options: ['No, I\'m settled and not open to moving', 'Possibly, depending on the location and stage of relationship', 'Yes, I\'m open to relocating in future'] },
      { id: 'alternativeTherapies', text: 'How do you feel about natural or alternative therapies (e.g., acupuncture, energy healing, naturopathy)?', type: 'select', options: ['I use them regularly or believe strongly in them', 'I\'m open-minded but don\'t use them myself', 'I\'m neutral or unsure', 'I don\'t believe in them and prefer traditional medicine'] },
      { id: 'vaccinations', text: 'Which statement best matches your views on vaccinations?', type: 'select', options: ['I follow recommended vaccination schedules for myself and family', 'I choose selectively based on my own research', 'I\'m generally unsure or neutral', 'I avoid vaccinations whenever possible'] },
      { id: 'diet', text: 'What best describes your usual diet?', type: 'select', options: ['No specific preference / I eat everything', 'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-free / dairy-free / other restriction', 'Other (please specify)'] },
      { id: 'dietPartner', text: 'Would you be comfortable with a partner who has a different diet to you?', type: 'select', options: ['Yes', 'I\'d prefer someone with a similar diet', 'No'] },
      { id: 'education', text: 'What\'s your highest level of education completed?', type: 'select', options: ['High school', 'Trade or vocational qualification', 'University – Bachelor\'s degree', 'Postgraduate (Master\'s, PhD, etc.)', 'Other (please specify)'] },
      { id: 'educationPartner', text: 'Is your partner\'s level of education important to you?', type: 'select', options: ['Not important', 'Somewhat important', 'Very important'] },
      { id: 'profession', text: 'What is your profession?', type: 'text' },
      { id: 'income', text: 'What is your income per annum?', type: 'text' },
      { id: 'workHoursPerWeek', text: 'On average, how many hours do you work per week?', type: 'select', options: ['Under 20 hours', '20–30 hours', '30–40 hours', '40–50 hours', 'Over 50 hours'] },
      { id: 'workSchedule', text: 'What are your usual work hours?', type: 'select', options: ['Mostly weekdays, 9–5', 'Shift work (e.g., nights or weekends)', 'Flexible or remote hours', 'Varies week to week'] },
      { id: 'workTravel', text: 'Do you travel for work?', type: 'select', options: ['No, not at all', 'Occasionally (a few times a year)', 'Regularly (monthly or more)'] },
      { id: 'partnerWorkTravel', text: 'Would you be happy if your partner\'s job involved regular travel?', type: 'select', options: ['Yes, I\'d enjoy the space and independence', 'It\'s okay as long as we stay connected', 'I\'d prefer someone who is mostly at home'] },
      { id: 'workFlexibility', text: 'Would your current job allow flexibility to prioritise a relationship?', type: 'select', options: ['Yes, I have good flexibility', 'Some flexibility, depending on the time', 'Not much flexibility right now', 'No, my job is very demanding'] },
      { id: 'partnerFlexibility', text: 'How important is it that your partner has flexibility to spend time with you?', type: 'select', options: ['Very important – quality time is a top priority', 'Somewhat important – I understand busy periods', 'Not important – I value independence in a relationship'] },
      { id: 'workSatisfaction', text: 'Are you happy with your current work situation?', type: 'select', options: ['Yes, I enjoy what I do and feel fulfilled', 'It\'s fine for now, but I\'m open to change', 'Not really – I\'m actively seeking something else'] },
      { id: 'careerFuture', text: 'Do you see yourself in the same profession in 5 years?', type: 'select', options: ['Yes, I plan to grow in this field', 'Possibly, but I\'m open to change', 'No, I want to move into something different'] },
      { id: 'careerApproach', text: 'Which best describes your approach to your career?', type: 'select', options: ['I work to live – it\'s not my main focus', 'I like my job but it\'s not everything', 'I\'m driven and ambitious in my career', 'My career is central to my identity and lifestyle'] },
      { id: 'financialExpectations', text: 'What best describes your financial expectations in a relationship?', type: 'select', options: ['I\'m happy to contribute equally', 'I\'d prefer to be financially supported', 'I\'d prefer to support my partner financially', 'I\'d prefer we each contribute in a way that reflects our incomes', 'Open to discussion based on the relationship'] },
      { id: 'householdResponsibilities', text: 'Which best describes your view on household responsibilities?', type: 'select', options: ['I prefer traditional roles (e.g., one person cooks, the other earns)', 'I believe roles should be shared equally', 'I prefer to do more of one side (e.g., cooking, cleaning, finances)', 'I\'m open to discussing roles based on individual strengths and time'] },
      { id: 'workLifeBalance', text: 'How do you feel about your current work-life balance?', type: 'select', options: ['I\'m mostly focused on work', 'I try to keep a balance but it\'s hard', 'I feel like I\'ve found a good rhythm', 'I prioritise lifestyle over work'] },

      { id: 'hobbiesTypes', text: 'What types of activities do you enjoy in your free time? (Select up to 5)', type: 'multiselect', options: ['Reading & literature', 'Movies & TV shows', 'Music (listening or playing)', 'Visual arts & crafts', 'Cooking & culinary exploration', 'Outdoor adventures (hiking, camping)', 'Sports & fitness', 'Gaming (video games, board games)', 'Travel & exploring new places', 'Wining & dining', 'Learning & personal development', 'Home improvement & DIY', 'Gardening & plants', 'Collecting (art, antiques, etc.)', 'Mindfulness & meditation', 'Dancing & performance arts', 'Volunteering & community service', 'Writing & journaling', 'Photography'] },

      { id: 'hobbiesSocial', text: 'Do you prefer to enjoy your hobbies and interests:', type: 'select', options: ['Mostly alone or independently', 'Mostly with others in a social setting', 'A mix of both solo and social activities', 'With just one or two close people', 'In organized groups or communities'] },

      { id: 'hobbiesDetail', text: 'Tell us more about your specific interests, hobbies, or passions that make you unique: (optional)', type: 'text', optional: true },

      { id: 'hobbiesSharing', text: 'How important is it that your partner shares your interests and hobbies?', type: 'select', options: ['Very important - I want to share most activities', 'Somewhat important - I\'d like to share some key interests', 'Nice but not essential - I value having some separate interests', 'Not important - I prefer having mostly separate hobbies'] },

      { id: 'hobbiesOpenness', text: 'How open are you to trying new activities that your partner enjoys?', type: 'select', options: ['Very open - I love experiencing new things', 'Somewhat open - I\'ll try things that seem interesting to me', 'Selective - I prefer sticking to activities I know I enjoy', 'Not very open - I have established interests I prefer to focus on'] },

    ]
  },
  {
    id: 'relationships',
    title: 'Values & Goals',
    questions: [
      { id: 'religion', text: 'Do you follow any religious or spiritual beliefs?', type: 'select', options: ['No', 'Yes – Christian', 'Yes – Catholic', 'Yes – Muslim', 'Yes – Hindu', 'Yes – Buddhist', 'Yes – Jewish', 'Yes – Sikh', 'Yes – Spiritual but not religious', 'Yes – Other (please specify)', 'Agnostic', 'Prefer not to say'], showOtherInput: true },
      { id: 'religionImportance', text: 'How important are religious or spiritual beliefs in your life?', type: 'select', options: ['Not important', 'Somewhat important', 'Very important', 'Central to my life'] },
      { id: 'religionPartner', text: 'Do you want your partner to share your beliefs?', type: 'select', options: ['Yes, strongly prefer it', 'Ideally yes, but flexible', 'No, I\'m open'] },
      { id: 'familyCloseness', text: 'How close are you to your family?', type: 'select', options: ['Very close', 'Somewhat close', 'Not close', 'Not in contact'] },
      { id: 'familyPartner', text: 'Do you want your partner to be close with their family?', type: 'select', options: ['Very important to me', 'Somewhat important', 'Not important'] },
      { id: 'familyInvolvement', text: 'How involved should your partner be with your family?', type: 'select', options: ['Very involved', 'Just for key events', 'Not much', 'Prefer to keep it separate'] },
      { id: 'children', text: 'Do you want children?', type: 'select', options: ['Yes', 'Open to it', 'No'] },

      { id: 'marriage', text: 'Do you want to get married one day?', type: 'select', options: ['Yes', 'Open to it', 'No'] },
      { id: 'relationshipPace', text: 'How quickly do you like a relationship to progress?', type: 'select', options: ['Slowly', 'Naturally', 'Fairly quickly'] },
      { id: 'longDistance', text: 'Would you consider a long-distance relationship?', type: 'select', options: ['Yes', 'Only short term', 'No'] },
      { id: 'relationshipTherapy', text: 'Would you try relationship coaching or therapy if needed?', type: 'select', options: ['Yes', 'Maybe', 'No'] },
      { id: 'conflictStyle', text: 'How do you usually handle conflict?', type: 'select', options: ['Talk about it straight away', 'Take space, then talk', 'Avoid it', 'Try to understand first'] },
      { id: 'conflictPartner', text: 'How do you want a partner to handle conflict?', type: 'select', options: ['Stay calm and talk', 'Give space, then return', 'Reassure first', 'Keep it light'] },
      { id: 'decisionMaking', text: 'How do you prefer decisions to be made in a relationship?', type: 'select', options: ['Together', 'A mix', 'I lead', 'Partner leads'] },
      { id: 'independence', text: 'How much independence do you want in a relationship?', type: 'select', options: ['A lot – I need my own space', 'A balance', 'I like doing most things together'] },
      { id: 'livingArrangement', text: 'What is your ideal living arrangement with a partner?', type: 'select', options: ['Living together full-time', 'Living together part-time', 'Separate homes but nearby', 'Open to what works best for both'] },
      { id: 'humour', text: 'How would you describe your sense of humour?', type: 'select', options: ['Dry / sarcastic', 'Silly / goofy', 'Dark / edgy', 'Witty / clever', 'Playful teasing'] },
      { id: 'stressHandling', text: 'How do you typically handle stress?', type: 'select', options: ['I need alone time', 'I talk it through with others', 'I use physical activity (e.g., gym, walking)', 'I use creative outlets (e.g., music, art, writing)', 'I practise meditation or mindfulness'] },
      { id: 'decisionApproach', text: 'How do you typically make important decisions?', type: 'select', options: ['Logically – I analyse pros and cons', 'Based on gut feelings or emotion', 'I consult others for advice', 'I use a mix of logic and intuition'] },

      { id: 'personalValues', text: 'What values are most important to you personally? (Select up to 3)', type: 'multiselect', options: ['Loyalty', 'Honesty', 'Ambition', 'Kindness', 'Family', 'Health & fitness', 'Adventurous / curious'] },
      { id: 'partnerValues', text: 'What values are most important for your partner to have? (Select up to 3)', type: 'multiselect', options: ['Loyalty', 'Honesty', 'Ambition', 'Kindness', 'Family', 'Health & fitness', 'Adventurous / curious'] },
      { id: 'otherValues', text: 'Are there any other values that matter to you in a relationship? (optional)', type: 'text', optional: true }
    ]
  },
  {
    id: 'personality',
    title: 'Emotional Intelligence',
    questions: [
      { id: 'introExtro', text: 'Would you describe yourself more as:', type: 'select', options: ['Introverted – I recharge alone', 'Extroverted – I recharge around others', 'A mix of both (ambivert)'] },
      { id: 'stress', text: 'How do you usually manage stress?', type: 'select', options: ['I need alone time', 'I talk it through with someone', 'I exercise or move my body', 'I get creative (music, writing, etc.)', 'I use mindfulness or meditation', 'I tend to shut down or avoid it'] },
      { id: 'spontaneous', text: 'How spontaneous are you?', type: 'select', options: ['Very – I love last-minute plans', 'Somewhat – I enjoy surprises now and then', 'Not very – I prefer routine and planning'] },
      { id: 'weekends', text: 'How do you usually spend your weekends?', type: 'select', options: ['Socialising or going out', 'Relaxing at home', 'Outdoors or staying active', 'Doing hobbies or creative projects', 'Running errands or catching up on rest'] },
      { id: 'decision', text: 'When making big decisions, what guides you most?', type: 'select', options: ['Logic and facts', 'My feelings', 'I ask others for input', 'A mix of logic and instinct'] },
      { id: 'recharge', text: 'How do you recharge after a long day or week?', type: 'select', options: ['Time alone', 'Quality time with people I love', 'Being outdoors or active', 'A good show/book/podcast', 'Sleep and rest'] },
      { id: 'showEmotions', text: 'How do you usually show your emotions?', type: 'select', options: ['I express them openly', 'I hold them in until I\'m ready', 'I tend to downplay or mask them', 'I show them more through actions than words'] },
      { id: 'respondEmotions', text: 'How do you usually respond to someone else\'s emotions?', type: 'select', options: ['I try to comfort and support them', 'I feel unsure of how to help', 'I listen and try to stay neutral', 'I give them space and check in later'] },
      { id: 'personalGrowth', text: 'How do you handle your own personal growth?', type: 'select', options: ['I actively seek growth and self-awareness', 'I work on it when things get tough', 'I tend to avoid deep reflection', 'I\'m not sure where to start, but I\'m open'] },
      { id: 'pastRelationships', text: 'Do you think your past relationships affect how you show up in new ones?', type: 'select', options: ['Yes, I\'ve learned a lot and grown', 'Yes, I have some habits or hesitations', 'A little, but I don\'t let the past define me', 'Not really'] },
      { id: 'partnerTraits', text: 'What emotional traits are most important in a partner? (Select up to 3)', type: 'multiselect', options: ['Self-awareness', 'Empathy', 'Optimism', 'Patience', 'Strong communication', 'Affectionate nature'] },
      { id: 'selfTraits', text: 'What emotional traits best describe you? (Select up to 3)', type: 'multiselect', options: ['Calm and grounded', 'Thoughtful and observant', 'Warm and affectionate', 'Driven and focused', 'Playful and expressive', 'Sensitive and reflective'] },
    ]
  },
  {
    id: 'loveLanguage',
    title: 'Love Language',
    questions: [
      { id: 'showLove', text: 'How do you usually show love or care to someone you\'re close to?', type: 'select', options: ['I do things for them (helping, errands, making life easier)', 'I give them gifts or thoughtful surprises', 'I say kind, encouraging, or loving things', 'I spend quality time with them', 'I give hugs, kisses, or hold their hand'] },
      { id: 'feelLoved', text: 'How do you feel most loved by a partner?', type: 'select', options: ['When they do things to support me', 'When they surprise me with gifts or gestures', 'When they tell me how they feel about me', 'When we spend uninterrupted time together', 'When they are physically affectionate'] },
      { id: 'physicalComfort', text: 'How comfortable are you with giving physical affection?', type: 'select', options: ['Very comfortable – it\'s natural for me', 'Somewhat comfortable – depends on the setting', 'I\'m a bit reserved, but I try', 'I prefer other ways of showing love'] },
      { id: 'everydayAffection', text: 'How much affection do you like in everyday life (e.g., hugs, cuddles, hand-holding)?', type: 'select', options: ['A lot – I really enjoy physical closeness', 'A moderate amount – I like it but not constantly', 'A little – I\'m more low-key with affection', 'Very little – I prefer space'] },
      { id: 'qualityTime', text: 'What does quality time in a relationship look like to you? (Select your top choice)', type: 'select', options: ['Deep conversations', 'Doing fun activities together', 'Being in the same space doing our own thing', 'Going on dates or trips', 'Uninterrupted time without phones or distractions'] },
      { id: 'receiveCompliments', text: 'How do you prefer to receive compliments or appreciation?', type: 'select', options: ['In words – I like to hear it', 'In actions – showing me means more', 'In thoughtful gestures or surprises', 'In touch – a hug or hand on the back says a lot'] },
      { id: 'expressLoveImportance', text: 'How important is it to you that your partner expresses love regularly?', type: 'select', options: ['Very important – I need regular signs of love', 'Important, but it doesn\'t have to be constant', 'A little important – I don\'t need much', 'Not very important – I show love more than I need to receive it'] },
      { id: 'feelValued', text: 'In your own words, how do you feel most valued and loved in a relationship? (optional)', type: 'text', optional: true },
    ]
  },
  {
    id: 'attraction',
    title: 'Attraction',
    questions: [
      { id: 'physicalAttraction', text: 'How important is physical attraction to you in a relationship?', type: 'select', options: ['Very important', 'Somewhat important', 'It\'s part of it, but not a priority', 'Not important'] },
      { id: 'physicalAppearance', text: 'How would you describe your physical appearance?', type: 'select', options: ['Slim', 'Athletic', 'Average build', 'Curvy', 'Plus size', 'Tall', 'Petite'] },
      { id: 'height', text: 'What is your height?', type: 'text' },
      { id: 'ethnicBackground', text: 'What is your ethnic background?', type: 'select', options: ['Caucasian', 'Middle Eastern', 'South Asian (e.g., Indian, Pakistani, Sri Lankan)', 'East Asian (e.g., Chinese, Japanese, Korean)', 'Southeast Asian (e.g., Filipino, Thai, Vietnamese)', 'Māori / Pasifika', 'African', 'Indigenous Australian / Torres Strait Islander', 'Latin American / Hispanic', 'Mixed background', 'Other (please specify)'], showOtherInput: true },
      { id: 'ethnicPreference', text: 'Do you have any preferences when it comes to a partner\'s ethnicity or cultural background?', type: 'select', options: ['No preference', 'Yes – I\'m open, but I do have a preference'], showOtherInput: true },
      { id: 'tattoos', text: 'Do you have any tattoos?', type: 'select', options: ['Yes', 'No'] },
      { id: 'piercings', text: 'Do you have any piercings?', type: 'select', options: ['Yes', 'No'] },
      { id: 'cosmeticEnhancements', text: 'Have you had any cosmetic enhancements or procedures (e.g., injectables, surgery, body contouring)?', type: 'select', options: ['Yes', 'No'] },
      { id: 'partnerCosmeticEnhancements', text: 'Would you be comfortable if your partner had cosmetic enhancements?', type: 'select', options: ['Yes, absolutely', 'I\'m open to it', 'I\'d prefer they didn\'t', 'No preference'] },
      { id: 'personalStyle', text: 'How would you describe your personal style and grooming?', type: 'select', options: ['Casual and low-maintenance', 'Neat and polished', 'Trendy or fashion-forward', 'Practical and comfortable', 'Classic or timeless', 'Other (please specify)'], showOtherInput: true, optional: true },
      { id: 'attractiveTraits', text: 'What physical traits do you tend to find attractive?', type: 'multiselect', options: ['Tall', 'Strong build', 'Lean/fit', 'Curvy', 'Petite', 'Natural look', 'Well-groomed', 'Unique features'] },
      { id: 'partnerGrooming', text: 'How would you describe your ideal partner\'s grooming or style?', type: 'select', options: ['Well-groomed and polished', 'Casual and natural', 'Clean and simple', 'Stylish and expressive', 'I don\'t have a strong preference'] },
      { id: 'heightPreference', text: 'What are your height preferences in a partner?', type: 'select', options: ['No preference', 'Prefer someone taller than me', 'Prefer someone shorter than me', 'Prefer similar height'] },
      { id: 'partnerTattoos', text: 'How do you feel about tattoos on a partner?', type: 'select', options: ['I love them', 'I like them in moderation', 'Neutral – I don\'t mind either way', 'Prefer minimal or none'] },
      { id: 'partnerPiercings', text: 'How do you feel about piercings on a partner?', type: 'select', options: ['I love them', 'I like them in moderation', 'Neutral – I don\'t mind either way', 'Prefer minimal or none'] },
      { id: 'partnerCosmeticView', text: 'How do you feel about cosmetic enhancements on a partner?', type: 'select', options: ['Very open – it\'s a personal choice', 'I\'m okay with minor enhancements (e.g., injectables)', 'Prefer a natural appearance', 'No strong opinion'] },
    ]
  },

  {
    id: 'intimacy',
    title: 'Intimacy',
    questions: [
      { id: 'sexImportance', text: 'How important is sex in a long-term relationship to you?', type: 'select', options: ['Very important', 'Somewhat important', 'It\'s not a major priority', 'Not important'] },
      { id: 'sexFrequency', text: 'How often would you ideally like to be intimate with a partner?', type: 'select', options: ['Daily or almost daily', 'A few times per week', 'Weekly', 'A few times per month', 'Rarely'] },
      { id: 'sexCommunication', text: 'How comfortable are you talking about intimacy and sexual needs with a partner?', type: 'select', options: ['Very comfortable', 'Comfortable once there\'s trust', 'It takes me a while', 'I struggle to talk about it'] },
      { id: 'sexOpenness', text: 'Are you open to exploring new things in the bedroom?', type: 'select', options: ['Yes, I enjoy trying new things', 'Somewhat – with the right person', 'I prefer to keep things familiar', 'No, I\'m not comfortable with that'] },
      { id: 'libido', text: 'How would you describe your sexual energy level (libido)?', type: 'select', options: ['High', 'Moderate', 'Low', 'Unsure'] },
      { id: 'spontaneity', text: 'Do you prefer intimacy to be more spontaneous or planned?', type: 'select', options: ['Spontaneous – in the moment', 'A mix of both', 'Mostly planned or scheduled'] },
      { id: 'foreplay', text: 'How important is foreplay to you?', type: 'select', options: ['Very important', 'Somewhat important', 'Not that important'] },
      { id: 'dominance', text: 'Do you have any preferences around dominance or control in the bedroom?', type: 'select', options: ['I prefer to take the lead', 'I prefer my partner to take the lead', 'I like a balance', 'I don\'t have a preference'] },
      { id: 'verbalCommunication', text: 'How do you feel about verbal communication during intimacy (e.g., talking, encouragement, check-ins)?', type: 'select', options: ['I like it and find it important', 'I\'m okay with some talking', 'I prefer minimal talking', 'I don\'t like it'] },
      { id: 'variety', text: 'How important is variety and creativity in your intimate life?', type: 'select', options: ['Very important – I enjoy mixing things up', 'Somewhat important – I like some variety', 'Not important – I prefer routine and consistency'] },
      { id: 'afterIntimacy', text: 'After intimacy, what helps you feel most connected?', type: 'select', options: ['Cuddling or physical closeness', 'Verbal reassurance or compliments', 'Quiet time together', 'Space and alone time'] },
      { id: 'exclusivity', text: 'Would you expect sexual exclusivity in a relationship?', type: 'select', options: ['Yes – always exclusive', 'Yes – unless discussed otherwise', 'No – I\'m open to non-exclusive dynamics'] },
      { id: 'differentDrives', text: 'How would you feel if you and your partner had different sex drives?', type: 'select', options: ['I\'d be okay as long as we communicate', 'It could be challenging but manageable', 'It would be a dealbreaker'] },
      { id: 'emotionalConnection', text: 'Do you feel that sex strengthens your emotional connection?', type: 'select', options: ['Yes – it\'s deeply emotional for me', 'Sometimes – depends on the relationship', 'No – I see it as separate from emotions'] },
      { id: 'intimacyBoundaries', text: 'Are there any boundaries, preferences, or things that are important to you when it comes to intimacy? (optional)', type: 'text', optional: true },
    ]
  },
  {
    id: 'dealBreakers',
    title: 'Deal-Breakers',
    questions: [
      { id: 'dealBreakers', text: 'Do any of the following apply as deal breakers for you? (Tick all that apply)', type: 'multiselect', options: [
        'I wouldn\'t date someone who already has children',
        'I wouldn\'t date someone who smokes',
        'I wouldn\'t date someone who drinks heavily',
        'I wouldn\'t date someone who uses drugs',
        'I wouldn\'t date someone who has been married before',
        'I wouldn\'t date someone who lacks ambition or direction'
      ]},
      { id: 'otherDealBreakers', text: 'Are there any other deal breakers for you that aren\'t listed here?', type: 'text', optional: true }
    ]
  }
];

// Maximum questions per page
const MAX_QUESTIONS_PER_PAGE = 6;

export default function Questionnaire() {
  const auth: AuthContextType = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [otherInputs, setOtherInputs] = useState<{[key: string]: string}>({});
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
      // For simplicity, consider a section complete if at least 80% of its questions are answered
      const sectionQuestions = section.questions.map(q => `${section.id}_${q.id}`);
      const answeredQuestions = sectionQuestions.filter(id => answers[id] !== undefined);
      
      // Mark as complete if at least 80% of questions are answered
      const completionThreshold = 0.8;
      completed[section.id] = answeredQuestions.length >= Math.ceil(sectionQuestions.length * completionThreshold);
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
    const answerId = `${currentSectionData.id}_${questionId}`;
    
    // Clear other input if selecting a different option
    if (typeof value === 'string' && !value.includes('Other') && typeof answers[answerId] === 'string' && answers[answerId]?.includes('Other')) {
      setOtherInputs(prev => {
        const newInputs = {...prev};
        delete newInputs[answerId];
        return newInputs;
      });
    }
    
    setAnswers(prev => ({
      ...prev,
      [answerId]: value
    }));
  };
  
  const handleMultiselect = (questionId: string, value: string) => {
    const answerId = `${currentSectionData.id}_${questionId}`;
    const currentValues = answers[answerId] || [];
    
    let newValues;
    if (currentValues.includes(value)) {
      // Remove the value if already selected
      newValues = currentValues.filter((v: string) => v !== value);
    } else {
      // Add the value if not already selected (up to 3)
      if (currentValues.length < 3) {
        newValues = [...currentValues, value];
      } else {
        // Already have 3 selected, don't add more
        return;
      }
    }
    
    setAnswers(prev => ({
      ...prev,
      [answerId]: newValues
    }));
  };
  
  const handleOtherInput = (questionId: string, value: string) => {
    const answerId = `${currentSectionData.id}_${questionId}`;
    setOtherInputs(prev => ({
      ...prev,
      [answerId]: value
    }));
    
    // Update the main answer to include the other text
    const baseAnswer = typeof answers[answerId] === 'string' ? answers[answerId].split(' - ')[0] : answers[answerId];
    setAnswers(prev => ({
      ...prev,
      [answerId]: value ? `${baseAnswer} - ${value}` : baseAnswer
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
      // Final save and show completion page
      await saveProgress(true);
      setShowCompletion(true);
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
      
      // Base update data
      const updateData: Record<string, any> = {
        questionnaireAnswers: answers,
        completedSections: completedSections,
        questionnaireCompleted: isComplete,
        questionnaireLastUpdated: new Date().toISOString()
      };
      
      // If the questionnaire is complete, generate a summary using ChatGPT
      if (isComplete) {
        try {
          const response = await fetch('/api/generate-summary', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ questionnaireAnswers: answers })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.summary) {
              // Add the summary to the update data
              updateData.personalSummary = data.summary;
            }
          } else {
            console.error('Failed to generate summary:', await response.text());
          }
        } catch (error) {
          console.error('Error generating summary:', error);
          // Continue with the save even if summary generation fails
        }
      }
      
      await updateDoc(userRef, updateData);
    } catch (error) {
      console.error('Error saving questionnaire progress:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderQuestion = (question: any) => {
    const answerId = `${currentSectionData.id}_${question.id}`;
    const currentAnswer = answers[answerId] || '';
    
    // Check if this is a conditional question and should be shown
    if (question.conditionalOn) {
      const parentQuestionId = `${currentSectionData.id}_${question.conditionalOn.questionId}`;
      const parentAnswer = answers[parentQuestionId] || '';
      
      // If the condition is not met, don't render this question
      if (parentAnswer !== question.conditionalOn.value) {
        return null;
      }
    }

    switch (question.type) {
      case 'text':
        return (
          <div className="mb-6">
            <label className={`block text-white mb-6 text-base md:text-lg ${inter.className} group-hover:text-[#3B00CC] transition-colors duration-300 font-medium`}>{question.text}</label>
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              className={`w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#34D8F1] ${inter.className}`}
            />
          </div>
        );
      
      case 'select':
        const answerId = `${currentSectionData.id}_${question.id}`;
        const showOtherInput = question.showOtherInput && typeof currentAnswer === 'string' && 
          (currentAnswer.includes('Other') || 
           (question.id === 'ethnicPreference' && currentAnswer.includes('Yes')));
        const otherValue = otherInputs[answerId] || '';
        
        return (
          <div className="mb-6">
            <label className={`block text-white mb-6 text-base md:text-lg ${inter.className} group-hover:text-[#3B00CC] transition-colors duration-300 font-medium`}>{question.text}</label>
            <div className="flex flex-wrap justify-center gap-6 mt-6">
              {question.options.map((option: string) => {
                // For selected "Other" option, show the custom text if available
                const displayText = option.includes('Other') && typeof currentAnswer === 'string' && currentAnswer === option && otherValue 
                  ? `Other - ${otherValue}` 
                  : option;
                  
                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(question.id, option)}
                    className={`w-40 h-40 text-sm font-medium p-5 whitespace-normal rounded-full backdrop-blur-sm transition-all duration-300 flex items-center justify-center overflow-hidden shadow-md ${inter.className} ${
                      currentAnswer === option
                        ? 'bg-[#73FFF6] text-[#3B00CC] border-2 border-[#73FFF6] shadow-lg shadow-[#73FFF6]/30'
                        : 'bg-white/10 text-white border border-white/30 hover:bg-white/20 hover:scale-105'
                    }`}
                  >
                    {displayText}
                  </button>
                );
              })}
            </div>
            
            {showOtherInput && (
              <div className="mt-4 max-w-md mx-auto">
                <input
                  type="text"
                  value={otherValue}
                  onChange={(e) => handleOtherInput(question.id, e.target.value)}
                  placeholder="Please specify..."
                  className={`w-full p-3 rounded-lg bg-white/10 border border-[#73FFF6] text-white focus:outline-none focus:ring-2 focus:ring-[#73FFF6] ${inter.className}`}
                  autoFocus
                />
              </div>
            )}
          </div>
        );
      
      case 'scale':
        return (
          <div className="mb-6">
            <label className={`block text-white mb-6 text-base md:text-lg ${inter.className} group-hover:text-[#3B00CC] transition-colors duration-300 font-medium`}>{question.text}</label>
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
                          ? 'bg-[#73FFF6] text-[#3B00CC]'
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
      
      case 'multiselect':
        const multiValues = Array.isArray(currentAnswer) ? currentAnswer : [];
        const selectedCount = multiValues.length;
        
        return (
          <div className="mb-6">
            <label className={`block text-white mb-6 text-base md:text-lg ${inter.className} group-hover:text-[#3B00CC] transition-colors duration-300 font-medium`}>{question.text}</label>
            {selectedCount > 0 && (
              <p className={`text-white/70 text-sm mb-4 ${inter.className}`}>
                {selectedCount}/3 selected
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-6 mt-6">
              {question.options.map((option: string) => {
                const isSelected = multiValues.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => handleMultiselect(question.id, option)}
                    className={`w-40 h-40 text-sm font-medium p-5 whitespace-normal rounded-full backdrop-blur-sm transition-all duration-300 flex items-center justify-center overflow-hidden shadow-md ${inter.className} ${
                      isSelected
                        ? 'bg-[#73FFF6] text-[#3B00CC] border-2 border-[#73FFF6] shadow-lg shadow-[#73FFF6]/30'
                        : 'bg-white/10 text-white border border-white/30 hover:bg-white/20 hover:scale-105'
                    }`}
                    disabled={selectedCount >= 3 && !isSelected}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col">
        {/* Background container with fixed position to cover entire viewport */}
        <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
          <div className="absolute inset-0 overflow-hidden">
            <OrbField />
          </div>
        </div>
        {/* Loading Content */}
        <div className="relative z-10 flex items-center justify-center h-screen w-full">
          <div className="flex flex-col items-center">
            <Image
              src="/vettly-logo.png"
              alt="Vettly Logo"
              width={180}
              height={45}
              className="h-auto w-auto mb-8"
              priority
            />
            <div className="w-16 h-16 border-4 border-[#34D8F1] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-white font-medium">Loading your questionnaire...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (showInstructions) {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col">
        {/* Background container with fixed position to cover entire viewport */}
        <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
          <div className="absolute inset-0 overflow-hidden">
            <OrbField />
          </div>
        </div>
        
        {/* Instructions Content */}
        <div className="relative z-10 flex flex-col min-h-screen w-full">
          <div className="flex justify-center pt-8 pb-4">
            <Image
              src="/vettly-logo.png"
              alt="Vettly Logo"
              width={120}
              height={30}
              className="h-auto w-auto"
              priority
            />
          </div>
          <div className="flex flex-col items-center max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-6 py-8 text-center flex-grow justify-center">

            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Before You Begin</h1>
            
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl border border-white/20 shadow-xl">
              <p className={`${inter.className} text-white text-lg mb-6 leading-relaxed`}>
                This questionnaire is here to help us understand you: your lifestyle, values, preferences, and what you're genuinely looking for in a partner.
              </p>
              
              <p className={`${inter.className} text-white text-lg mb-6 leading-relaxed`}>
                Please answer honestly. There are no right or wrong answers, and your responses are confidential. Be clear about what matters to you, but try not to limit yourself. Sometimes past experiences or unconscious biases can get in the way of meeting someone truly great.
              </p>
              
              <p className={`${inter.className} text-white text-lg mb-6 leading-relaxed`}>
                Keep an open mind. We're here to help you find someone who not only meets your preferences but also aligns with your deeper relationship goals.
              </p>
              
              <p className="text-white text-xl font-semibold mt-8 mb-4">
                Let's begin.
              </p>
              
              <button 
                onClick={() => setShowInstructions(false)}
                className={`${inter.className} mt-6 px-12 py-4 bg-[#3B00CC] hover:bg-[#2800A3] transition-colors rounded-full text-white font-bold text-lg shadow-lg shadow-purple-900/30`}
              >
                Start Questionnaire
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (showCompletion) {
    return (
      <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col">
        {/* Background container with fixed position to cover entire viewport */}
        <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
          <div className="absolute inset-0 overflow-hidden">
            <OrbField />
          </div>
        </div>
        
        {/* Completion Content */}
        <div className="relative z-10 flex flex-col min-h-screen w-full">
          <div className="flex justify-center pt-8 pb-4">
            <Image
              src="/vettly-logo.png"
              alt="Vettly Logo"
              width={120}
              height={30}
              className="h-auto w-auto"
              priority
            />
          </div>
          <div className="flex flex-col items-center max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-6 py-8 text-center flex-grow justify-center">
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">You're All Done</h1>
            
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl border border-white/20 shadow-xl">
              <p className={`${inter.className} text-white text-lg mb-6 leading-relaxed`}>
                We've now started the matchmaking process.
              </p>
              
              <p className={`${inter.className} text-white text-lg mb-6 leading-relaxed`}>
                You'll be notified as soon as we have a potential match. There's no exact timeline, as finding the right person takes time, but know that we're on it.
              </p>
              
              <p className={`${inter.className} text-white text-lg mb-6 leading-relaxed`}>
                We're excited to be part of your journey.
              </p>
              
              <button 
                onClick={() => router.push('/dashboard')}
                className={`${inter.className} mt-6 px-12 py-4 bg-[#3B00CC] hover:bg-[#2800A3] transition-colors rounded-full text-white font-bold text-lg shadow-lg shadow-purple-900/30`}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col lg:flex-row">
      {/* Background container with fixed position to cover entire viewport */}
      <div className="fixed inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom right, #2800A3, #34D8F1)', zIndex: -10 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#34D8F1]/20 via-transparent to-[#34D8F1]/20" />
        <div className="absolute inset-0 overflow-hidden">
          <OrbField />
        </div>
      </div>
      {/* Main Content Area */}
      <main className="flex-1 relative z-10 overflow-hidden flex flex-col lg:flex-row">

        {/* Sidebar */}
        <div className="relative z-20 w-full lg:w-48 xl:w-52 bg-transparent backdrop-blur-sm border-r border-white/10 overflow-y-auto hidden lg:block">
          <div className="p-6">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <Image
                src="/vettly-logo.png"
                alt="Vettly Logo"
                width={100}
                height={25}
                className="h-auto w-auto"
                priority
              />

            </div>
            
            {/* Section Navigation */}
            <div className="space-y-3">
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
                    className={`w-full text-left p-3 rounded-lg flex items-center transition-all duration-200 ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className={`rounded-full flex items-center justify-center border-2 ${
                          isComplete 
                            ? 'bg-[#5EFAD7] border-[#5EFAD7]' 
                            : isActive 
                              ? 'bg-white/20 border-white/40' 
                              : 'bg-white/10 border-white/20'
                        }`} 
                        style={{ 
                          width: '28px', 
                          height: '28px', 
                          minWidth: '28px', 
                          minHeight: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {isComplete && (
                          <svg className="w-4 h-4 text-[#4A1D96]" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${inter.className} text-white font-medium leading-tight`}>{section.title}</span>
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
                width={100}
                height={25}
                className="h-auto w-auto"
                priority
              />

            </div>

            {/* Back Button - Mobile */}
            <div className="flex justify-start mb-4 px-4 lg:hidden">
              <button 
                onClick={() => router.push('/dashboard')}
                className={`text-white hover:text-[#73FFF6] transition-colors ${inter.className}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-[1800px] mx-auto px-2 md:px-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl text-white ${inter.className}`}>Your Progress</h3>
                </div>
                {/* Progress Bar */}
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full !bg-gradient-to-r !from-[#73FFF6] !to-[#3B00CC]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Questionnaire Content */}
            <div className="w-full max-w-[1800px] mx-auto px-2 md:px-4">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 mb-8">
                <div className="flex items-center mb-8">
                  <div className="flex items-center">
                    <h3 className={`text-4xl md:text-5xl text-white font-bold ${playfair.className}`}>{currentSectionData.title}</h3>
                  </div>
                </div>
                {/* Questions - 2 Column Layout for Desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full">
                  {currentQuestions.map((question) => (
                    <div key={question.id} className="group relative p-4 md:p-6 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
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
                    className="!bg-[#73FFF6] !py-2 !px-4 md:!py-3 md:!px-20 !text-[#3B00CC] hover:!bg-[#73FFF6]/90"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : currentSection === SECTIONS.length - 1 && currentPage === totalPagesInSection - 1 ? (
                      <span>Complete</span>
                    ) : (
                      <span>Next</span>
                    )}
                  </PulseButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/10 z-20 lg:hidden">
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
                      ? 'bg-white/20 text-white' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                    isComplete 
                      ? 'bg-[#73FFF6] border-[#73FFF6]' 
                      : isActive 
                        ? 'bg-white/20 border-white' 
                        : 'bg-white/10 border-white/50'
                  }`}>
                    {isComplete && (
                      <svg className="w-3 h-3 text-[#3B00CC]" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${inter.className}`}>{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
