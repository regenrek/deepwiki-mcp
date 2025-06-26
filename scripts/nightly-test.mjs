#!/usr/bin/env node
import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

// Sample popular GitHub repos for testing
const POPULAR_REPOS = [
    'vercel/next.js', 'facebook/react', 'vuejs/core', 'angular/angular',
    'microsoft/vscode', 'microsoft/typescript', 'nodejs/node', 'denoland/deno',
    'rust-lang/rust', 'golang/go', 'python/cpython', 'ruby/ruby',
    'rails/rails', 'django/django', 'laravel/laravel', 'symfony/symfony',
    'expressjs/express', 'nestjs/nest', 'fastify/fastify', 'koajs/koa',
    'webpack/webpack', 'rollup/rollup', 'parcel-bundler/parcel', 'evanw/esbuild',
    'vitejs/vite', 'vercel/turbo', 'facebook/jest', 'mochajs/mocha',
    'cypress-io/cypress', 'playwright/playwright', 'puppeteer/puppeteer',
    'electron/electron', 'tauri-apps/tauri', 'flutter/flutter', 'facebook/react-native',
    'sveltejs/svelte', 'solidjs/solid', 'preactjs/preact', 'alpinejs/alpine',
    'tailwindlabs/tailwindcss', 'mui/material-ui', 'ant-design/ant-design',
    'chakra-ui/chakra-ui', 'storybookjs/storybook', 'prettier/prettier',
    'eslint/eslint', 'typescript-eslint/typescript-eslint', 'babel/babel',
    'facebook/docusaurus', 'gatsbyjs/gatsby', 'nuxt/nuxt', 'remix-run/remix',
    'blitz-js/blitz', 'redwoodjs/redwood', 'strapi/strapi', 'directus/directus',
    'supabase/supabase', 'hasura/graphql-engine', 'apollographql/apollo-server',
    'graphql/graphql-js', 'prisma/prisma', 'typeorm/typeorm', 'sequelize/sequelize',
    'mongodb/node-mongodb-native', 'redis/node-redis', 'elastic/elasticsearch-js',
    'apache/kafka', 'socketio/socket.io', 'websockets/ws', 'uWebSockets/uWebSockets.js',
    'axios/axios', 'node-fetch/node-fetch', 'sindresorhus/got', 'request/request',
    'cheeriojs/cheerio', 'jsdom/jsdom', 'GoogleChrome/lighthouse',
    'markedjs/marked', 'markdown-it/markdown-it', 'docsifyjs/docsify',
    'facebook/lexical', 'ianstormtaylor/slate', 'quilljs/quill', 'tinymce/tinymce',
    'codemirror/codemirror5', 'microsoft/monaco-editor', 'ajaxorg/ace',
    'lodash/lodash', 'ramda/ramda', 'date-fns/date-fns', 'moment/moment',
    'chartjs/Chart.js', 'd3/d3', 'apache/echarts', 'plotly/plotly.js',
    'mapbox/mapbox-gl-js', 'Leaflet/Leaflet', 'openlayers/openlayers',
    'three.js/three.js', 'pixijs/pixijs', 'fabricjs/fabric.js',
    'tensorflow/tfjs', 'onnx/onnxjs', 'mljs/ml', 'huggingface/transformers.js'
];

// Shuffle and take 100 random repos
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

const TEST_REPOS = shuffleArray(POPULAR_REPOS).slice(0, 100);

async function testRepo(repo) {
    return new Promise((resolve) => {
        const url = `https://deepwiki.com/${repo}`;
        const start = Date.now();

        const child = spawn('node', ['dist/cli.js'], {
            env: { ...process.env, LIGHTPANDA_DISABLE_TELEMETRY: 'true' }
        });

        let output = '';
        let error = '';

        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.stderr.on('data', (data) => {
            error += data.toString();
        });

        child.on('close', (code) => {
            const elapsed = Date.now() - start;
            const success = code === 0 && output.includes('"ok":true');

            resolve({
                repo,
                url,
                success,
                elapsed,
                error: error || (success ? null : 'Failed to render')
            });
        });

        // Send test request
        child.stdin.write(JSON.stringify({
            id: repo,
            url,
            as: 'markdown'
        }) + '\n');

        child.stdin.end();

        // Timeout after 30 seconds
        setTimeout(() => {
            child.kill('SIGTERM');
        }, 30000);
    });
}

async function runTests() {
    console.log(`Testing ${TEST_REPOS.length} random DeepWiki repos...`);

    const results = [];
    const batchSize = 10;

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < TEST_REPOS.length; i += batchSize) {
        const batch = TEST_REPOS.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(testRepo));
        results.push(...batchResults);

        console.log(`Progress: ${results.length}/${TEST_REPOS.length}`);
    }

    // Calculate statistics
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const successRate = (successful.length / results.length) * 100;
    const avgTime = successful.reduce((sum, r) => sum + r.elapsed, 0) / successful.length;

    console.log('\n=== Test Results ===');
    console.log(`Total repos tested: ${results.length}`);
    console.log(`Successful: ${successful.length} (${successRate.toFixed(1)}%)`);
    console.log(`Failed: ${failed.length}`);
    console.log(`Average render time: ${avgTime.toFixed(0)}ms`);

    // Write detailed results
    const report = {
        date: new Date().toISOString(),
        summary: {
            total: results.length,
            successful: successful.length,
            failed: failed.length,
            successRate,
            avgTime
        },
        results
    };

    writeFileSync('nightly-test-results.json', JSON.stringify(report, null, 2));

    // Check if we meet the 92% threshold
    if (successRate < 92) {
        console.error(`\n❌ Success rate ${successRate.toFixed(1)}% is below 92% threshold!`);
        console.error('\nFailed repos:');
        failed.forEach(f => {
            console.error(`- ${f.repo}: ${f.error}`);
        });

        // Create GitHub issue if GITHUB_TOKEN is available
        if (process.env.GITHUB_TOKEN) {
            // This would normally create an issue via GitHub API
            console.log('\nWould create GitHub issue for degraded performance.');
        }

        process.exit(1);
    } else {
        console.log(`\n✅ Success rate ${successRate.toFixed(1)}% meets threshold!`);
    }
}

runTests().catch(console.error);