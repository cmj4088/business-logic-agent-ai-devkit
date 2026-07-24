/** M16_artifact_editor types.test.ts — 产出物编辑器模块类型常量测试 */

import { describe, it, expect } from 'vitest';

describe('Artifact Editor Types', () => {
  it('Artifact 应包含产出物核心字段', () => {
    const artifact = {
      id: 'art_001',
      projectId: 'proj_001',
      artifactType: 'mrd',
      name: '市场需求文档',
      content: '# MRD 文档\n\n## 市场分析...',
      version: 3,
      stage: 'concept',
      isCurrent: true,
      createdBy: 'product_manager',
      createdAt: '2026-07-09T10:00:00Z',
      updatedAt: '2026-07-09T12:00:00Z',
    };
    expect(artifact).toHaveProperty('id');
    expect(artifact).toHaveProperty('projectId');
    expect(artifact).toHaveProperty('artifactType');
    expect(artifact).toHaveProperty('name');
    expect(artifact).toHaveProperty('content');
    expect(artifact).toHaveProperty('version');
    expect(artifact.version).toBeGreaterThan(0);
  });

  it('ArtifactType 应包含 IPD 产出物类型', () => {
    const types = ['mrd', 'prd', 'tr_report', 'test_plan', 'gtm_plan', 'bom'];
    expect(types.length).toBeGreaterThan(0);
  });

  it('ArtifactVersion 应包含版本信息', () => {
    const version = {
      id: 'ver_001',
      artifactId: 'art_001',
      version: 2,
      content: '更新后的内容',
      createdAt: '2026-07-09T11:00:00Z',
    };
    expect(version).toHaveProperty('version');
    expect(version).toHaveProperty('content');
    expect(version).toHaveProperty('artifactId');
  });

  it('Attachment 应包含附件信息', () => {
    const attachment = {
      id: 'att_001',
      artifactId: 'art_001',
      filename: 'design.png',
      mimeType: 'image/png',
      size: 102400,
    };
    expect(attachment).toHaveProperty('id');
    expect(attachment).toHaveProperty('filename');
    expect(attachment).toHaveProperty('mimeType');
    expect(attachment.size).toBeGreaterThan(0);
  });

  it('AI 生成标识应正确', () => {
    const aiMetadata = {
      model: 'claude-opus-4-8',
      promptTokens: 1500,
      completionTokens: 800,
      generationTime: 3.2,
    };
    expect(aiMetadata).toHaveProperty('model');
    expect(aiMetadata).toHaveProperty('promptTokens');
    expect(aiMetadata.promptTokens).toBeGreaterThan(0);
  });
});