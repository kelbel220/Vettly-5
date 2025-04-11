# Setting Up OpenAI API for Vettly

To enable the OpenAI GPT-4 integration for generating personalized summaries, you need to:

1. Create a `.env.local` file in the root directory of your project
2. Add your OpenAI API key to the file

## Step-by-Step Instructions

1. Sign up for an OpenAI API key at https://platform.openai.com/ if you don't have one already
2. Create a new file named `.env.local` in the root directory of your project
3. Add the following line to the file:

```
OPENAI_API_KEY=your_actual_api_key_here
```

4. Replace `your_actual_api_key_here` with your actual OpenAI API key
5. Save the file
6. Restart the development server

## Important Security Notes

- Never commit your `.env.local` file to version control
- Keep your API key secure and don't share it publicly
- The `.env.local` file is already in the `.gitignore` file to prevent accidental commits

After completing these steps, the application will use GPT-4 to generate personalized summaries instead of the mock generator.
