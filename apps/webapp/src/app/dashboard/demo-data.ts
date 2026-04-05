import type { Document, Submission, InsightsResult } from '@/libs/api';

const NOW = new Date().toISOString();
const D = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

const ROOT_VERSION_ID = 'demo-v1';
const ML_VERSION_ID = 'demo-v2';
const BACKEND_VERSION_ID = 'demo-v3';
export const DEMO_DOC_ID = 'demo-doc-1';

export const DEMO_DOCUMENTS: Document[] = [
    {
        id: DEMO_DOC_ID,
        title: 'Alex Rivera — Software Engineer',
        description: 'Main CV, ATS-safe baseline',
        owner_id: 'demo-user',
        root_version_id: ROOT_VERSION_ID,
        created_at: D(45),
        updated_at: D(3),
        versions: [
            {
                id: ROOT_VERSION_ID,
                branch_name: 'root',
                version_label: 'v1.0 baseline',
                parent_version_id: null,
                structured_blocks: [
                    { path: 'heading[1]', block_type: 'heading', text: 'Alex Rivera', keywords: [] },
                    { path: 'summary[1]', block_type: 'summary', text: 'Software engineer with 5 years of experience building distributed systems and ML pipelines at scale.', keywords: ['distributed', 'systems', 'machine', 'learning'] },
                    { path: 'heading[2]', block_type: 'heading', text: 'Experience', keywords: [] },
                    { path: 'bullet[1]', block_type: 'bullet', text: 'Led migration of monolithic data pipeline to distributed microservices, reducing p99 latency by 40%.', keywords: ['distributed', 'microservices', 'latency', 'pipeline'] },
                    { path: 'bullet[2]', block_type: 'bullet', text: 'Designed feature flag system used by 50+ engineers across 3 teams.', keywords: ['system', 'design', 'engineers'] },
                    { path: 'heading[3]', block_type: 'heading', text: 'Skills', keywords: [] },
                    { path: 'skills[1]', block_type: 'skills', text: 'Python, Go, TypeScript, SQL, Kubernetes, AWS, PyTorch', keywords: ['python', 'go', 'typescript', 'pytorch', 'kubernetes'] },
                ],
                artifact_docx_key: 'demo/demo-cv.docx',
                patches: [],
                public_assets: [],
                created_at: D(45),
                updated_at: D(45),
            },
            {
                id: ML_VERSION_ID,
                branch_name: 'ml-engineer',
                version_label: 'ML-focused variant',
                parent_version_id: ROOT_VERSION_ID,
                structured_blocks: [
                    { path: 'heading[1]', block_type: 'heading', text: 'Alex Rivera', keywords: [] },
                    { path: 'summary[1]', block_type: 'summary', text: 'ML engineer specialising in large-scale PyTorch training pipelines, distributed inference, and production-grade MLOps.', keywords: ['pytorch', 'distributed', 'mlops', 'inference'] },
                    { path: 'heading[2]', block_type: 'heading', text: 'Experience', keywords: [] },
                    { path: 'bullet[1]', block_type: 'bullet', text: 'Contributed PyTorch anomaly detection model achieving 92% precision on production traffic at 2M events/day.', keywords: ['pytorch', 'machine learning', 'production', 'precision'] },
                    { path: 'bullet[2]', block_type: 'bullet', text: 'Built streaming data ingestion system (Kafka + Flink) powering real-time ML feature store.', keywords: ['kafka', 'flink', 'streaming', 'feature store'] },
                    { path: 'heading[3]', block_type: 'heading', text: 'Skills', keywords: [] },
                    { path: 'skills[1]', block_type: 'skills', text: 'PyTorch, Python, Go, Kubernetes, Spark, dbt, AWS SageMaker', keywords: ['pytorch', 'python', 'kubernetes', 'spark', 'sagemaker'] },
                ],
                artifact_docx_key: 'demo/demo-cv.docx',
                patches: [
                    { id: 'dp1', target_path: 'summary[1]', operation: 'replace_text', old_value: 'Software engineer…', new_value: 'ML engineer specialising…', created_at: D(30) },
                    { id: 'dp2', target_path: 'skills[1]', operation: 'boost_keyword', old_value: null, new_value: 'PyTorch', created_at: D(30) },
                ],
                public_assets: [{
                    id: 'demo-asset-1', slug: 'alex-ml', artifact_key: 'public/alex-ml.docx',
                    is_public: true, url: '/demo-cv.docx', version_id: ML_VERSION_ID, submission_id: null, created_at: D(20),
                }],
                created_at: D(30),
                updated_at: D(3),
            },
            {
                id: BACKEND_VERSION_ID,
                branch_name: 'backend-engineer',
                version_label: 'Backend-focused variant',
                parent_version_id: ROOT_VERSION_ID,
                structured_blocks: [
                    { path: 'heading[1]', block_type: 'heading', text: 'Alex Rivera', keywords: [] },
                    { path: 'summary[1]', block_type: 'summary', text: 'Backend engineer focused on high-throughput API design, distributed systems, and reliability engineering.', keywords: ['backend', 'api', 'distributed', 'reliability'] },
                    { path: 'bullet[1]', block_type: 'bullet', text: 'Led migration to microservices, reducing p99 latency by 40% under 10k RPS sustained load.', keywords: ['microservices', 'latency', 'rps', 'distributed'] },
                    { path: 'skills[1]', block_type: 'skills', text: 'Go, Python, PostgreSQL, Redis, gRPC, Kubernetes, AWS', keywords: ['go', 'postgresql', 'redis', 'grpc', 'kubernetes'] },
                ],
                artifact_docx_key: 'demo/demo-cv.docx',
                patches: [
                    { id: 'dp3', target_path: 'summary[1]', operation: 'replace_text', old_value: 'Software engineer…', new_value: 'Backend engineer…', created_at: D(25) },
                ],
                public_assets: [],
                created_at: D(25),
                updated_at: D(10),
            },
        ],
    },
];

export const DEMO_SUBMISSIONS: Submission[] = [
    {
        id: 'ds1', version_id: ML_VERSION_ID, company_name: 'Anthropic', role_title: 'ML Research Engineer',
        job_url: null, job_description: null, status: 'pending_review', created_at: D(18),
        suggestions: [
            { id: 's1', target_path: 'summary[1]', operation: 'boost_keyword', proposed_text: 'constitutional ai', rationale: 'Highlight alignment research experience', accepted: true, metadata_json: { confidence: 0.82 } },
            { id: 's2', target_path: 'bullet[1]', operation: 'replace_text', proposed_text: 'Built distributed PyTorch training pipeline handling constitutional AI fine-tuning at scale.', rationale: 'Align with Anthropic stack', accepted: true, metadata_json: { confidence: 0.74 } },
        ],
    },
    {
        id: 'ds2', version_id: ML_VERSION_ID, company_name: 'Google DeepMind', role_title: 'Senior ML Engineer',
        job_url: null, job_description: null, status: 'pending_review', created_at: D(14),
        suggestions: [
            { id: 's3', target_path: 'skills[1]', operation: 'boost_keyword', proposed_text: 'JAX', rationale: 'DeepMind uses JAX heavily', accepted: true, metadata_json: { confidence: 0.71 } },
            { id: 's4', target_path: 'bullet[2]', operation: 'replace_text', proposed_text: 'Built large-scale streaming pipeline underpinning real-time feature store for JAX model serving.', rationale: 'Add JAX context', accepted: true, metadata_json: { confidence: 0.68 } },
        ],
    },
    {
        id: 'ds3', version_id: ML_VERSION_ID, company_name: 'OpenAI', role_title: 'Research Engineer',
        job_url: null, job_description: null, status: 'published', created_at: D(10),
        suggestions: [
            { id: 's5', target_path: 'summary[1]', operation: 'replace_text', proposed_text: 'ML engineer with track record in large-scale training infrastructure and RLHF pipelines.', rationale: 'OpenAI focus on RLHF', accepted: true, metadata_json: { confidence: 0.77 } },
        ],
    },
    {
        id: 'ds4', version_id: ML_VERSION_ID, company_name: 'Meta AI', role_title: 'ML Infrastructure Engineer',
        job_url: null, job_description: null, status: 'archived', created_at: D(22),
        suggestions: [
            { id: 's6', target_path: 'bullet[1]', operation: 'boost_keyword', proposed_text: 'PyTorch', rationale: 'Meta maintains PyTorch', accepted: true, metadata_json: { confidence: 0.55 } },
            { id: 's7', target_path: 'summary[1]', operation: 'suppress_block', proposed_text: null, rationale: 'Summary too generic', accepted: false, metadata_json: { confidence: 0.3 } },
        ],
    },
    {
        id: 'ds5', version_id: BACKEND_VERSION_ID, company_name: 'Stripe', role_title: 'Senior Backend Engineer',
        job_url: null, job_description: null, status: 'pending_review', created_at: D(8),
        suggestions: [
            { id: 's8', target_path: 'bullet[1]', operation: 'replace_text', proposed_text: 'Led migration to microservices achieving 99.99% uptime across Stripe-scale payment processing.', rationale: 'Emphasise reliability', accepted: true, metadata_json: { confidence: 0.79 } },
        ],
    },
    {
        id: 'ds6', version_id: BACKEND_VERSION_ID, company_name: 'Cloudflare', role_title: 'Staff Engineer',
        job_url: null, job_description: null, status: 'archived', created_at: D(20),
        suggestions: [
            { id: 's9', target_path: 'skills[1]', operation: 'boost_keyword', proposed_text: 'Rust', rationale: 'Cloudflare uses Rust', accepted: true, metadata_json: { confidence: 0.4 } },
        ],
    },
];

export const DEMO_INSIGHTS: InsightsResult = {
    total_submissions: 6,
    positive_count: 4,
    positive_rate: 0.667,
    has_data: true,
    operation_impact: [
        { operation: 'replace_text', total: 5, positive: 4, rate: 0.8 },
        { operation: 'boost_keyword', total: 5, positive: 3, rate: 0.6 },
        { operation: 'suppress_block', total: 1, positive: 0, rate: 0.0 },
    ],
    top_positive_keywords: [
        { keyword: 'pytorch', positive_count: 4, negative_count: 1, lift: 4.0 },
        { keyword: 'distributed', positive_count: 3, negative_count: 0, lift: 3.0 },
        { keyword: 'pipeline', positive_count: 3, negative_count: 1, lift: 3.0 },
        { keyword: 'scale', positive_count: 3, negative_count: 1, lift: 3.0 },
        { keyword: 'reliability', positive_count: 2, negative_count: 0, lift: 2.0 },
        { keyword: 'inference', positive_count: 2, negative_count: 0, lift: 2.0 },
    ],
    top_negative_keywords: [
        { keyword: 'generic', positive_count: 0, negative_count: 2, lift: 0.0 },
        { keyword: 'suppress', positive_count: 0, negative_count: 1, lift: 0.0 },
    ],
    section_impact: [
        { section: 'summary', positive_rate: 0.83, count: 6 },
        { section: 'bullet', positive_rate: 0.75, count: 4 },
        { section: 'skills', positive_rate: 0.5, count: 4 },
    ],
};
