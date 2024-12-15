# Bayesian AB Testing

## Repository Breakdowns
This repository is the final project for MA 578 Bayesian A/B Testing. The project aims to demonstrate the powerful techniques via using Bayesian Inference on A/B Testing, instead of the frequentist approach.

The current dataset leverages the Kaggle dataset we used, a marketing dataset consists of two groups: PSA (public service announcement) and AD (advertisement), please refer to [Marketing AB Testing](https://www.kaggle.com/datasets/faviovaz/marketing-ab-testing).

The project has demonstrated frequentist approach's pitfalls on multiple peeking, misinterpreting p-values, and on time-series, sequential tests.

If you would like to read our report, please refer to:
[Final Report](docs/Final_Report_Bayesian_A_B_Testing.pdf)

This repository consists our demos:

1. A React JS demo on daily and hourly analysis on the bayesian hypothesis testing for the 
2. IPython Notebooks to showcase various Frequentist approach, e.g. Student's T-Test or Chi-square Test.

## Instruction to Build and Run the Demo
1. Make sure you have successfully installed NPM (e.g. via https://nodejs.org/en/download/package-manager).
2. Clone the Github repository from the repo (e.g. git clone https://github.com/PalmPalm7/bayesian_ab_testing.git).
3. Install the required npm packages (e.g. npm install jstat).
4. Start running the React App by using `npm start` or `npm restart`
5. View the application on http://localhost:3000/, or the corresponding port.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Interpret Results from Bayesian Analysis
To use for Bayesian A/B testing, please refer to the three specific dashboards.

### Daily Dashboard

The daily analysis dashboard is a summary of the whole dataset, with a visualization on the conversion rate and count of the advertisement impression per day.

The logic is self explanatory, for further explanation, please refer to:
https://github.com/PalmPalm7/bayesian_ab_testing/blob/main/src/components/DailyDashboard.jsx

Daily Analysis Dashboard

This will be the main tool you will use to determine the effectiveness of the two groups.

The "Probability Ad Better than PSA" section calculates the fraction of posterior samples where the Ad group's sampled conversion rate is higher than the PSA group's sampled conversion rate. This fraction represents the Bayesian posterior probability that the Ad variant is better than the PSA variant, given the data and the chosen priors.

The posterior distribution is obtained by using a  Beta distribution to model the conversion rate. Given some data (number of conversions and trials in each group), we update the prior Beta distributions for both groups to get posterior distributions. These posterior distributions reflect our updated beliefs about the true conversion rates after seeing the data.

For each group (Ad and PSA), the posterior is a Beta distribution determined by: 
Posterior(p)=Beta(p; α + successes, β + failures)
where α and β typically start at 1 and 1 (a uniform prior), and "successes" and "failures" are derived from the observed conversion data.

In the Javascript code, it is implemented this way:
const ad_alpha_post = 1 + adSuccesses;
const ad_beta_post = 1 + (adTrials - adSuccesses);
const psa_alpha_post = 1 + psaSuccesses;
const psa_beta_post = 1 + (psaTrials - psaSuccesses);

Then we draw SAMPLE_SIZE = 10,000 random samples from each posterior distribution where each sample represents a plausible "true" conversion rate scenario based on the observed data and the prior.

const adPosterior = Array.from({length: SAMPLE_SIZE}, () => jStat.beta.sample(ad_alpha_post, ad_beta_post));
const psaPosterior = Array.from({length: SAMPLE_SIZE}, () => jStat.beta.sample(psa_alpha_post, psa_beta_post));

In the end, the posterior comparison is done by estimating the probability that one group is better than the other, once we have arrays of samples from the Ad group’s posterior and the PSA group’s posterior.

let countAdBetter = 0;
for (let i = 0; i < SAMPLE_SIZE; i++) {
  if (adPosterior[i] > psaPosterior[i]) countAdBetter++;
}
const probAdBetter = countAdBetter / SAMPLE_SIZE;

In other words, for each pair of samples (adPosterior[i], psaPosterior[i]), it checks if adPosterior[i] > psaPosterior[i]. If this happens most of the time, it means that the Ad variant likely has a higher true conversion rate than the PSA variant, given the data and priors.



Hourly Analysis Dashboard


At last, there is a hourly analysis dashboard that utilizes the logic similar to the daily analysis dashboard.
