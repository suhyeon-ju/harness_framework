"""
execute.py 리팩터링 안전망 테스트.
리팩터링 전후 동작이 동일한지 검증한다.
"""

import json
import os
import subprocess
import sys
import textwrap
from datetime import datetime, timezone, timedelta
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).parent))
import execute as ex


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def tmp_project(tmp_path):
    """phases/, CLAUDE.md, docs/ 를 갖춘 임시 프로젝트 구조."""
    phases_dir = tmp_path / "phases"
    phases_dir.mkdir()

    claude_md = tmp_path / "CLAUDE.md"
    claude_md.write_text("# Rules\n- rule one\n- rule two")

    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    (docs_dir / "arch.md").write_text("# Architecture\nSome content")
    (docs_dir / "guide.md").write_text("# Guide\nAnother doc")

    return tmp_path


@pytest.fixture
def phase_dir(tmp_project):
    """step 3개를 가진 phase 디렉토리."""
    d = tmp_project / "phases" / "0-mvp"
    d.mkdir()

    index = {
        "project": "TestProject",
        "phase": "mvp",
        "steps": [
            {"step": 0, "name": "setup", "status": "completed", "summary": "프로젝트 초기화 완료"},
            {"step": 1, "name": "core", "status": "completed", "summary": "핵심 로직 구현"},
            {"step": 2, "name": "ui", "status": "pending"},
        ],
    }
    (d / "index.json").write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")
    (d / "step2.md").write_text("# Step 2: UI\n\nUI를 구현하세요.", encoding="utf-8")

    return d


@pytest.fixture
def top_index(tmp_project):
    """phases/index.json (top-level)."""
    top = {
        "phases": [
            {"dir": "0-mvp", "status": "pending"},
            {"dir": "1-polish", "status": "pending"},
        ]
    }
    p = tmp_project / "phases" / "index.json"
    p.write_text(json.dumps(top, indent=2), encoding="utf-8")
    return p


@pytest.fixture
def executor(tmp_project, phase_dir):
    """테스트용 StepExecutor 인스턴스. git 호출은 별도 mock 필요."""
    with patch.object(ex, "ROOT", tmp_project):
        inst = ex.StepExecutor("0-mvp")
    # 내부 경로를 tmp_project 기준으로 재설정
    inst._root = str(tmp_project)
    inst._phases_dir = tmp_project / "phases"
    inst._phase_dir = phase_dir
    inst._phase_dir_name = "0-mvp"
    inst._index_file = phase_dir / "index.json"
    inst._top_index_file = tmp_project / "phases" / "index.json"
    return inst


# ---------------------------------------------------------------------------
# _stamp (= 이전 now_iso)
# ---------------------------------------------------------------------------

class TestStamp:
    def test_returns_kst_timestamp(self, executor):
        result = executor._stamp()
        assert "+0900" in result

    def test_format_is_iso(self, executor):
        result = executor._stamp()
        dt = datetime.strptime(result, "%Y-%m-%dT%H:%M:%S%z")
        assert dt.tzinfo is not None

    def test_is_current_time(self, executor):
        before = datetime.now(ex.StepExecutor.TZ).replace(microsecond=0)
        result = executor._stamp()
        after = datetime.now(ex.StepExecutor.TZ).replace(microsecond=0) + timedelta(seconds=1)
        parsed = datetime.strptime(result, "%Y-%m-%dT%H:%M:%S%z")
        assert before <= parsed <= after


# ---------------------------------------------------------------------------
# _read_json / _write_json
# ---------------------------------------------------------------------------

class TestJsonHelpers:
    def test_roundtrip(self, tmp_path):
        data = {"key": "값", "nested": [1, 2, 3]}
        p = tmp_path / "test.json"
        ex.StepExecutor._write_json(p, data)
        loaded = ex.StepExecutor._read_json(p)
        assert loaded == data

    def test_save_ensures_ascii_false(self, tmp_path):
        p = tmp_path / "test.json"
        ex.StepExecutor._write_json(p, {"한글": "테스트"})
        raw = p.read_text(encoding="utf-8")
        assert "한글" in raw
        assert "\\u" not in raw

    def test_save_indented(self, tmp_path):
        p = tmp_path / "test.json"
        ex.StepExecutor._write_json(p, {"a": 1})
        raw = p.read_text(encoding="utf-8")
        assert "\n" in raw

    def test_load_nonexistent_raises(self, tmp_path):
        with pytest.raises(FileNotFoundError):
            ex.StepExecutor._read_json(tmp_path / "nope.json")


# ---------------------------------------------------------------------------
# _load_guardrails
# ---------------------------------------------------------------------------

class TestLoadGuardrails:
    def test_loads_claude_md_and_docs(self, executor, tmp_project):
        with patch.object(ex, "ROOT", tmp_project):
            result = executor._load_guardrails()
        assert "# Rules" in result
        assert "rule one" in result
        assert "# Architecture" in result
        assert "# Guide" in result

    def test_sections_separated_by_divider(self, executor, tmp_project):
        with patch.object(ex, "ROOT", tmp_project):
            result = executor._load_guardrails()
        assert "---" in result

    def test_docs_sorted_alphabetically(self, executor, tmp_project):
        with patch.object(ex, "ROOT", tmp_project):
            result = executor._load_guardrails()
        arch_pos = result.index("arch")
        guide_pos = result.index("guide")
        assert arch_pos < guide_pos

    def test_no_claude_md(self, executor, tmp_project):
        (tmp_project / "CLAUDE.md").unlink()
        with patch.object(ex, "ROOT", tmp_project):
            result = executor._load_guardrails()
        assert "CLAUDE.md" not in result
        assert "Architecture" in result

    def test_no_docs_dir(self, executor, tmp_project):
        import shutil
        shutil.rmtree(tmp_project / "docs")
        with patch.object(ex, "ROOT", tmp_project):
            result = executor._load_guardrails()
        assert "Rules" in result
        assert "Architecture" not in result

    def test_empty_project(self, tmp_path):
        with patch.object(ex, "ROOT", tmp_path):
            # executor가 필요 없는 static-like 동작이므로 임시 인스턴스
            phases_dir = tmp_path / "phases" / "dummy"
            phases_dir.mkdir(parents=True)
            idx = {"project": "T", "phase": "t", "steps": []}
            (phases_dir / "index.json").write_text(json.dumps(idx), encoding="utf-8")
            inst = ex.StepExecutor.__new__(ex.StepExecutor)
            result = inst._load_guardrails()
        assert result == ""


# ---------------------------------------------------------------------------
# _build_step_context
# ---------------------------------------------------------------------------

class TestBuildStepContext:
    def test_includes_completed_with_summary(self, phase_dir):
        index = json.loads((phase_dir / "index.json").read_text(encoding="utf-8"))
        result = ex.StepExecutor._build_step_context(index)
        assert "Step 0 (setup): 프로젝트 초기화 완료" in result
        assert "Step 1 (core): 핵심 로직 구현" in result

    def test_excludes_pending(self, phase_dir):
        index = json.loads((phase_dir / "index.json").read_text(encoding="utf-8"))
        result = ex.StepExecutor._build_step_context(index)
        assert "ui" not in result

    def test_excludes_completed_without_summary(self, phase_dir):
        index = json.loads((phase_dir / "index.json").read_text(encoding="utf-8"))
        del index["steps"][0]["summary"]
        result = ex.StepExecutor._build_step_context(index)
        assert "setup" not in result
        assert "core" in result

    def test_empty_when_no_completed(self):
        index = {"steps": [{"step": 0, "name": "a", "status": "pending"}]}
        result = ex.StepExecutor._build_step_context(index)
        assert result == ""

    def test_has_header(self, phase_dir):
        index = json.loads((phase_dir / "index.json").read_text(encoding="utf-8"))
        result = ex.StepExecutor._build_step_context(index)
        assert result.startswith("## 이전 Step 산출물")


# ---------------------------------------------------------------------------
# _build_preamble
# ---------------------------------------------------------------------------

class TestBuildPreamble:
    def test_includes_project_name(self, executor):
        result = executor._build_preamble("", "")
        assert "TestProject" in result

    def test_includes_guardrails(self, executor):
        result = executor._build_preamble("GUARD_CONTENT", "")
        assert "GUARD_CONTENT" in result

    def test_includes_step_context(self, executor):
        ctx = "## 이전 Step 산출물\n\n- Step 0: done"
        result = executor._build_preamble("", ctx)
        assert "이전 Step 산출물" in result

    def test_includes_commit_example(self, executor):
        result = executor._build_preamble("", "")
        assert "feat(mvp):" in result

    def test_includes_rules(self, executor):
        result = executor._build_preamble("", "")
        assert "작업 규칙" in result
        assert "AC" in result

    def test_no_retry_section_by_default(self, executor):
        result = executor._build_preamble("", "")
        assert "이전 시도 실패" not in result

    def test_retry_section_with_prev_error(self, executor):
        result = executor._build_preamble("", "", prev_error="타입 에러 발생")
        assert "이전 시도 실패" in result
        assert "타입 에러 발생" in result

    def test_includes_max_retries(self, executor):
        result = executor._build_preamble("", "")
        assert str(ex.StepExecutor.MAX_RETRIES) in result

    def test_includes_index_path(self, executor):
        result = executor._build_preamble("", "")
        assert "/phases/0-mvp/index.json" in result


# ---------------------------------------------------------------------------
# _update_top_index
# ---------------------------------------------------------------------------

class TestUpdateTopIndex:
    def test_completed(self, executor, top_index):
        executor._top_index_file = top_index
        executor._update_top_index("completed")
        data = json.loads(top_index.read_text(encoding="utf-8"))
        mvp = next(p for p in data["phases"] if p["dir"] == "0-mvp")
        assert mvp["status"] == "completed"
        assert "completed_at" in mvp

    def test_error(self, executor, top_index):
        executor._top_index_file = top_index
        executor._update_top_index("error")
        data = json.loads(top_index.read_text(encoding="utf-8"))
        mvp = next(p for p in data["phases"] if p["dir"] == "0-mvp")
        assert mvp["status"] == "error"
        assert "failed_at" in mvp

    def test_blocked(self, executor, top_index):
        executor._top_index_file = top_index
        executor._update_top_index("blocked")
        data = json.loads(top_index.read_text(encoding="utf-8"))
        mvp = next(p for p in data["phases"] if p["dir"] == "0-mvp")
        assert mvp["status"] == "blocked"
        assert "blocked_at" in mvp

    def test_other_phases_unchanged(self, executor, top_index):
        executor._top_index_file = top_index
        executor._update_top_index("completed")
        data = json.loads(top_index.read_text(encoding="utf-8"))
        polish = next(p for p in data["phases"] if p["dir"] == "1-polish")
        assert polish["status"] == "pending"

    def test_nonexistent_dir_is_noop(self, executor, top_index):
        executor._top_index_file = top_index
        executor._phase_dir_name = "no-such-dir"
        original = json.loads(top_index.read_text(encoding="utf-8"))
        executor._update_top_index("completed")
        after = json.loads(top_index.read_text(encoding="utf-8"))
        for p_before, p_after in zip(original["phases"], after["phases"]):
            assert p_before["status"] == p_after["status"]

    def test_no_top_index_file(self, executor, tmp_path):
        executor._top_index_file = tmp_path / "nonexistent.json"
        executor._update_top_index("completed")  # should not raise


# ---------------------------------------------------------------------------
# _checkout_branch (mocked)
# ---------------------------------------------------------------------------

class TestCheckoutBranch:
    def _mock_git(self, executor, responses):
        call_idx = {"i": 0}
        def fake_git(*args):
            idx = call_idx["i"]
            call_idx["i"] += 1
            if idx < len(responses):
                return responses[idx]
            return MagicMock(returncode=0, stdout="", stderr="")
        executor._run_git = fake_git

    def test_already_on_branch(self, executor):
        self._mock_git(executor, [
            MagicMock(returncode=0, stdout="feat-mvp\n", stderr=""),
        ])
        executor._checkout_branch()  # should return without checkout

    def test_branch_exists_checkout(self, executor):
        self._mock_git(executor, [
            MagicMock(returncode=0, stdout="main\n", stderr=""),   # HEAD 확인
            MagicMock(returncode=0, stdout="", stderr=""),          # status --porcelain (clean)
            MagicMock(returncode=0, stdout="", stderr=""),          # rev-parse --verify (있음)
            MagicMock(returncode=0, stdout="", stderr=""),          # checkout
        ])
        executor._checkout_branch()

    def test_branch_not_exists_create(self, executor):
        self._mock_git(executor, [
            MagicMock(returncode=0, stdout="main\n", stderr=""),   # HEAD 확인
            MagicMock(returncode=0, stdout="", stderr=""),          # status --porcelain (clean)
            MagicMock(returncode=1, stdout="", stderr="not found"), # rev-parse --verify (없음)
            MagicMock(returncode=0, stdout="", stderr=""),          # checkout -b
        ])
        executor._checkout_branch()

    def test_checkout_fails_exits(self, executor):
        self._mock_git(executor, [
            MagicMock(returncode=0, stdout="main\n", stderr=""),   # HEAD 확인
            MagicMock(returncode=0, stdout="", stderr=""),          # status --porcelain (clean)
            MagicMock(returncode=1, stdout="", stderr=""),          # rev-parse --verify (없음)
            MagicMock(returncode=1, stdout="", stderr="dirty tree"),# checkout -b 실패
        ])
        with pytest.raises(SystemExit) as exc_info:
            executor._checkout_branch()
        assert exc_info.value.code == 1

    def test_no_git_exits(self, executor):
        self._mock_git(executor, [
            MagicMock(returncode=1, stdout="", stderr="not a git repo"),
        ])
        with pytest.raises(SystemExit) as exc_info:
            executor._checkout_branch()
        assert exc_info.value.code == 1


# ---------------------------------------------------------------------------
# _commit_step (mocked)
# ---------------------------------------------------------------------------

class TestCommitStep:
    def test_two_phase_commit(self, executor):
        calls = []
        def fake_git(*args):
            calls.append(args)
            if args[:2] == ("diff", "--cached"):
                return MagicMock(returncode=1)
            return MagicMock(returncode=0, stdout="", stderr="")
        executor._run_git = fake_git

        executor._commit_step(2, "ui")

        commit_calls = [c for c in calls if c[0] == "commit"]
        assert len(commit_calls) == 2
        assert "feat(mvp):" in commit_calls[0][2]
        assert "chore(mvp):" in commit_calls[1][2]

    def test_no_code_changes_skips_feat_commit(self, executor):
        call_count = {"diff": 0}
        calls = []
        def fake_git(*args):
            calls.append(args)
            if args[:2] == ("diff", "--cached"):
                call_count["diff"] += 1
                if call_count["diff"] == 1:
                    return MagicMock(returncode=0)
                return MagicMock(returncode=1)
            return MagicMock(returncode=0, stdout="", stderr="")
        executor._run_git = fake_git

        executor._commit_step(2, "ui")

        commit_msgs = [c[2] for c in calls if c[0] == "commit"]
        assert len(commit_msgs) == 1
        assert "chore" in commit_msgs[0]


# ---------------------------------------------------------------------------
# _invoke_claude (mocked)
# ---------------------------------------------------------------------------

class TestInvokeClaude:
    def test_invokes_claude_with_correct_args(self, executor):
        mock_result = MagicMock(returncode=0, stdout='{"result": "ok"}', stderr="")
        step = {"step": 2, "name": "ui"}
        preamble = "PREAMBLE\n"

        with patch("subprocess.run", return_value=mock_result) as mock_run:
            output = executor._invoke_claude(step, preamble)

        cmd = mock_run.call_args[0][0]
        assert cmd[0] == "claude"
        assert "-p" in cmd
        assert "--dangerously-skip-permissions" in cmd
        assert "--output-format" in cmd
        assert "PREAMBLE" in cmd[-1]
        assert "UI를 구현하세요" in cmd[-1]

    def test_saves_output_json(self, executor):
        mock_result = MagicMock(returncode=0, stdout='{"ok": true}', stderr="")
        step = {"step": 2, "name": "ui"}

        with patch("subprocess.run", return_value=mock_result):
            executor._invoke_claude(step, "preamble")

        output_file = executor._phase_dir / "step2-output.json"
        assert output_file.exists()
        data = json.loads(output_file.read_text(encoding="utf-8"))
        assert data["step"] == 2
        assert data["name"] == "ui"
        assert data["exitCode"] == 0

    def test_nonexistent_step_file_exits(self, executor):
        step = {"step": 99, "name": "nonexistent"}
        with pytest.raises(SystemExit) as exc_info:
            executor._invoke_claude(step, "preamble")
        assert exc_info.value.code == 1

    def test_timeout_is_1800(self, executor):
        mock_result = MagicMock(returncode=0, stdout="{}", stderr="")
        step = {"step": 2, "name": "ui"}

        with patch("subprocess.run", return_value=mock_result) as mock_run:
            executor._invoke_claude(step, "preamble")

        assert mock_run.call_args[1]["timeout"] == 1800


# ---------------------------------------------------------------------------
# progress_indicator (= 이전 Spinner)
# ---------------------------------------------------------------------------

class TestProgressIndicator:
    def test_context_manager(self):
        import time
        with ex.progress_indicator("test") as pi:
            time.sleep(0.15)
        assert pi.elapsed >= 0.1

    def test_elapsed_increases(self):
        import time
        with ex.progress_indicator("test") as pi:
            time.sleep(0.2)
        assert pi.elapsed > 0


# ---------------------------------------------------------------------------
# main() CLI 파싱 (mocked)
# ---------------------------------------------------------------------------

class TestMainCli:
    def test_no_args_exits(self):
        with patch("sys.argv", ["execute.py"]):
            with pytest.raises(SystemExit) as exc_info:
                ex.main()
            assert exc_info.value.code == 2  # argparse exits with 2

    def test_invalid_phase_dir_exits(self):
        with patch("sys.argv", ["execute.py", "nonexistent"]):
            with patch.object(ex, "ROOT", Path("/tmp/fake_nonexistent")):
                with pytest.raises(SystemExit) as exc_info:
                    ex.main()
                assert exc_info.value.code == 1

    def test_missing_index_exits(self, tmp_project):
        (tmp_project / "phases" / "empty").mkdir()
        with patch("sys.argv", ["execute.py", "empty"]):
            with patch.object(ex, "ROOT", tmp_project):
                with pytest.raises(SystemExit) as exc_info:
                    ex.main()
                assert exc_info.value.code == 1


# ---------------------------------------------------------------------------
# _check_blockers (= 이전 main() error/blocked 체크)
# ---------------------------------------------------------------------------

class TestCheckBlockers:
    def _make_executor_with_steps(self, tmp_project, steps):
        d = tmp_project / "phases" / "test-phase"
        d.mkdir(exist_ok=True)
        index = {"project": "T", "phase": "test", "steps": steps}
        (d / "index.json").write_text(json.dumps(index), encoding="utf-8")

        with patch.object(ex, "ROOT", tmp_project):
            inst = ex.StepExecutor.__new__(ex.StepExecutor)
        inst._root = str(tmp_project)
        inst._phases_dir = tmp_project / "phases"
        inst._phase_dir = d
        inst._phase_dir_name = "test-phase"
        inst._index_file = d / "index.json"
        inst._top_index_file = tmp_project / "phases" / "index.json"
        inst._phase_name = "test"
        inst._total = len(steps)
        return inst

    def test_error_step_exits_1(self, tmp_project):
        steps = [
            {"step": 0, "name": "ok", "status": "completed"},
            {"step": 1, "name": "bad", "status": "error", "error_message": "fail"},
        ]
        inst = self._make_executor_with_steps(tmp_project, steps)
        with pytest.raises(SystemExit) as exc_info:
            inst._check_blockers()
        assert exc_info.value.code == 1

    def test_blocked_step_exits_2(self, tmp_project):
        steps = [
            {"step": 0, "name": "ok", "status": "completed"},
            {"step": 1, "name": "stuck", "status": "blocked", "blocked_reason": "API key"},
        ]
        inst = self._make_executor_with_steps(tmp_project, steps)
        with pytest.raises(SystemExit) as exc_info:
            inst._check_blockers()
        assert exc_info.value.code == 2


# ---------------------------------------------------------------------------
# _read_json / _write_json 에러 처리
# ---------------------------------------------------------------------------

class TestJsonErrorHandling:
    def test_read_json_corrupt_exits(self, tmp_path):
        p = tmp_path / "bad.json"
        p.write_text("{ invalid json }", encoding="utf-8")
        with pytest.raises(SystemExit) as exc_info:
            ex.StepExecutor._read_json(p)
        assert exc_info.value.code == 1

    def test_write_json_atomic_no_partial_on_error(self, tmp_path):
        p = tmp_path / "out.json"
        with patch("os.replace", side_effect=OSError("disk full")):
            with pytest.raises(SystemExit) as exc_info:
                ex.StepExecutor._write_json(p, {"key": "value"})
        assert exc_info.value.code == 1
        assert not p.exists()

    def test_write_json_cleans_tmp_on_error(self, tmp_path):
        p = tmp_path / "out.json"
        with patch("os.replace", side_effect=OSError("fail")):
            with pytest.raises(SystemExit):
                ex.StepExecutor._write_json(p, {"a": 1})
        assert not (tmp_path / "out.tmp").exists()


# ---------------------------------------------------------------------------
# _validate_index
# ---------------------------------------------------------------------------

class TestValidateIndex:
    def _make_phase(self, tmp_project, steps, create_md=True):
        d = tmp_project / "phases" / "v-phase"
        d.mkdir(parents=True, exist_ok=True)
        index = {"project": "T", "phase": "v", "steps": steps}
        (d / "index.json").write_text(json.dumps(index), encoding="utf-8")
        if create_md:
            for s in steps:
                if s.get("status") != "completed":
                    (d / f"step{s['step']}.md").write_text(f"# Step {s['step']}")
        return d, index

    def test_valid_index_passes(self, tmp_project):
        d, index = self._make_phase(tmp_project, [
            {"step": 0, "name": "setup", "status": "pending"},
        ])
        with patch.object(ex, "ROOT", tmp_project):
            inst = ex.StepExecutor("v-phase")
        assert inst._total == 1

    def test_missing_steps_array_exits(self, tmp_project):
        d = tmp_project / "phases" / "v2"
        d.mkdir(parents=True)
        (d / "index.json").write_text(json.dumps({"project": "T", "phase": "v2"}), encoding="utf-8")
        with patch.object(ex, "ROOT", tmp_project):
            with pytest.raises(SystemExit) as exc_info:
                ex.StepExecutor("v2")
        assert exc_info.value.code == 1

    def test_empty_steps_exits(self, tmp_project):
        d = tmp_project / "phases" / "v3"
        d.mkdir(parents=True)
        (d / "index.json").write_text(json.dumps({"project": "T", "phase": "v3", "steps": []}), encoding="utf-8")
        with patch.object(ex, "ROOT", tmp_project):
            with pytest.raises(SystemExit) as exc_info:
                ex.StepExecutor("v3")
        assert exc_info.value.code == 1

    def test_invalid_status_exits(self, tmp_project):
        d, index = self._make_phase(tmp_project, [
            {"step": 0, "name": "a", "status": "typo"},
        ])
        with patch.object(ex, "ROOT", tmp_project):
            with pytest.raises(SystemExit) as exc_info:
                ex.StepExecutor("v-phase")
        assert exc_info.value.code == 1

    def test_nonsequential_step_numbers_exits(self, tmp_project):
        d = tmp_project / "phases" / "v4"
        d.mkdir(parents=True)
        index = {"project": "T", "phase": "v4", "steps": [
            {"step": 0, "name": "a", "status": "pending"},
            {"step": 2, "name": "b", "status": "pending"},
        ]}
        (d / "index.json").write_text(json.dumps(index), encoding="utf-8")
        (d / "step0.md").write_text("# 0")
        (d / "step2.md").write_text("# 2")
        with patch.object(ex, "ROOT", tmp_project):
            with pytest.raises(SystemExit) as exc_info:
                ex.StepExecutor("v4")
        assert exc_info.value.code == 1

    def test_duplicate_step_numbers_exits(self, tmp_project):
        d = tmp_project / "phases" / "v5"
        d.mkdir(parents=True)
        index = {"project": "T", "phase": "v5", "steps": [
            {"step": 0, "name": "a", "status": "pending"},
            {"step": 0, "name": "b", "status": "pending"},
        ]}
        (d / "index.json").write_text(json.dumps(index), encoding="utf-8")
        (d / "step0.md").write_text("# 0")
        with patch.object(ex, "ROOT", tmp_project):
            with pytest.raises(SystemExit) as exc_info:
                ex.StepExecutor("v5")
        assert exc_info.value.code == 1

    def test_missing_step_md_exits(self, tmp_project):
        d = tmp_project / "phases" / "v6"
        d.mkdir(parents=True)
        index = {"project": "T", "phase": "v6", "steps": [
            {"step": 0, "name": "a", "status": "pending"},
        ]}
        (d / "index.json").write_text(json.dumps(index), encoding="utf-8")
        # step0.md 없음
        with patch.object(ex, "ROOT", tmp_project):
            with pytest.raises(SystemExit) as exc_info:
                ex.StepExecutor("v6")
        assert exc_info.value.code == 1

    def test_completed_step_does_not_require_md(self, tmp_project):
        d = tmp_project / "phases" / "v7"
        d.mkdir(parents=True)
        index = {"project": "T", "phase": "v7", "steps": [
            {"step": 0, "name": "a", "status": "completed", "summary": "done"},
            {"step": 1, "name": "b", "status": "pending"},
        ]}
        (d / "index.json").write_text(json.dumps(index), encoding="utf-8")
        (d / "step1.md").write_text("# 1")
        # step0.md 없어도 통과
        with patch.object(ex, "ROOT", tmp_project):
            inst = ex.StepExecutor("v7")
        assert inst._total == 2


# ---------------------------------------------------------------------------
# _checkout_branch — Detached HEAD / dirty 워킹트리
# ---------------------------------------------------------------------------

class TestCheckoutBranchEdgeCases:
    def _mock_git(self, executor, responses):
        call_idx = {"i": 0}
        def fake_git(*args):
            idx = call_idx["i"]
            call_idx["i"] += 1
            if idx < len(responses):
                return responses[idx]
            return MagicMock(returncode=0, stdout="", stderr="")
        executor._run_git = fake_git

    def test_detached_head_exits(self, executor):
        self._mock_git(executor, [
            MagicMock(returncode=0, stdout="HEAD\n", stderr=""),
        ])
        with pytest.raises(SystemExit) as exc_info:
            executor._checkout_branch()
        assert exc_info.value.code == 1

    def test_dirty_working_tree_warns_but_continues(self, executor, capsys):
        self._mock_git(executor, [
            MagicMock(returncode=0, stdout="main\n", stderr=""),
            MagicMock(returncode=0, stdout=" M some_file.py\n", stderr=""),
            MagicMock(returncode=1, stdout="", stderr=""),
            MagicMock(returncode=0, stdout="", stderr=""),
        ])
        executor._checkout_branch()
        captured = capsys.readouterr()
        assert "WARN" in captured.out


# ---------------------------------------------------------------------------
# _invoke_claude — TimeoutExpired
# ---------------------------------------------------------------------------

class TestInvokeClaudeEdgeCases:
    def test_timeout_marks_step_error_and_exits(self, executor):
        step = {"step": 2, "name": "ui"}
        with patch("subprocess.run", side_effect=subprocess.TimeoutExpired(cmd="claude", timeout=1800)):
            with pytest.raises(SystemExit) as exc_info:
                executor._invoke_claude(step, "preamble")
        assert exc_info.value.code == 1
        index = json.loads((executor._phase_dir / "index.json").read_text(encoding="utf-8"))
        step_data = next(s for s in index["steps"] if s["step"] == 2)
        assert step_data["status"] == "error"
        assert "타임아웃" in step_data["error_message"]

    def test_output_write_failure_warns_but_returns(self, executor, capsys):
        mock_result = MagicMock(returncode=0, stdout='{"ok": true}', stderr="")
        step = {"step": 2, "name": "ui"}
        with patch("subprocess.run", return_value=mock_result):
            with patch("os.replace", side_effect=OSError("disk full")):
                output = executor._invoke_claude(step, "preamble")
        captured = capsys.readouterr()
        assert "WARN" in captured.out
        assert output["step"] == 2


# ---------------------------------------------------------------------------
# _execute_all_steps — KeyboardInterrupt
# ---------------------------------------------------------------------------

class TestKeyboardInterrupt:
    def test_ctrl_c_marks_pending_step_as_error(self, executor, tmp_project):
        index = json.loads((executor._phase_dir / "index.json").read_text(encoding="utf-8"))
        # step 2는 pending 상태
        def fake_execute_single(step, guardrails):
            raise KeyboardInterrupt
        executor._execute_single_step = fake_execute_single
        executor._update_top_index = MagicMock()

        with pytest.raises(SystemExit) as exc_info:
            executor._execute_all_steps("")
        assert exc_info.value.code == 130

        index = json.loads((executor._phase_dir / "index.json").read_text(encoding="utf-8"))
        step_data = next(s for s in index["steps"] if s["step"] == 2)
        assert step_data["status"] == "error"
        assert "Ctrl+C" in step_data["error_message"]


# ---------------------------------------------------------------------------
# __init__ — phases/ 디렉토리 없을 때
# ---------------------------------------------------------------------------

class TestPhasesDirectoryCheck:
    def test_no_phases_dir_exits(self, tmp_path):
        """phases/ 디렉토리 자체가 없으면 exit(1) + Hint 출력."""
        with patch.object(ex, "ROOT", tmp_path):
            with pytest.raises(SystemExit) as exc_info:
                ex.StepExecutor("any-phase")
        assert exc_info.value.code == 1

    def test_phases_dir_exists_but_phase_missing_exits(self, tmp_project):
        """phases/ 는 있지만 해당 phase 디렉토리가 없으면 exit(1)."""
        with patch.object(ex, "ROOT", tmp_project):
            with pytest.raises(SystemExit) as exc_info:
                ex.StepExecutor("no-such-phase")
        assert exc_info.value.code == 1


# ---------------------------------------------------------------------------
# --require-permissions 플래그
# ---------------------------------------------------------------------------

class TestRequirePermissionsFlag:
    def test_skip_permissions_true_by_default(self, executor):
        assert executor._skip_permissions is True

    def test_skip_permissions_false_when_disabled(self, tmp_project, phase_dir):
        with patch.object(ex, "ROOT", tmp_project):
            inst = ex.StepExecutor("0-mvp", skip_permissions=False)
        assert inst._skip_permissions is False

    def test_cmd_includes_flag_when_skip_true(self, executor):
        mock_result = MagicMock(returncode=0, stdout="{}", stderr="")
        step = {"step": 2, "name": "ui"}
        with patch("subprocess.run", return_value=mock_result) as mock_run:
            executor._invoke_claude(step, "preamble")
        cmd = mock_run.call_args[0][0]
        assert "--dangerously-skip-permissions" in cmd

    def test_cmd_excludes_flag_when_skip_false(self, tmp_project, phase_dir):
        with patch.object(ex, "ROOT", tmp_project):
            inst = ex.StepExecutor("0-mvp", skip_permissions=False)
        inst._root = str(tmp_project)
        inst._phases_dir = tmp_project / "phases"
        inst._phase_dir = phase_dir
        inst._index_file = phase_dir / "index.json"

        mock_result = MagicMock(returncode=0, stdout="{}", stderr="")
        step = {"step": 2, "name": "ui"}
        with patch("subprocess.run", return_value=mock_result) as mock_run:
            inst._invoke_claude(step, "preamble")
        cmd = mock_run.call_args[0][0]
        assert "--dangerously-skip-permissions" not in cmd


# ---------------------------------------------------------------------------
# _execute_all_steps — 모든 step이 이미 완료된 경우
# ---------------------------------------------------------------------------

class TestAllStepsAlreadyCompleted:
    def test_prints_hint_when_all_completed(self, tmp_project, capsys):
        d = tmp_project / "phases" / "done-phase"
        d.mkdir(parents=True)
        index = {
            "project": "T", "phase": "done",
            "steps": [
                {"step": 0, "name": "a", "status": "completed", "summary": "done"},
            ],
        }
        (d / "index.json").write_text(json.dumps(index), encoding="utf-8")
        (d / "step0.md").write_text("# 0", encoding="utf-8")

        with patch.object(ex, "ROOT", tmp_project):
            inst = ex.StepExecutor("done-phase")
        inst._root = str(tmp_project)
        inst._phases_dir = tmp_project / "phases"
        inst._phase_dir = d
        inst._index_file = d / "index.json"
        inst._update_top_index = MagicMock()

        inst._execute_all_steps("")
        captured = capsys.readouterr()
        assert "이미 완료" in captured.out or "pending" in captured.out
