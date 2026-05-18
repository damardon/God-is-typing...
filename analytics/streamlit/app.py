"""
God is Typing — Public Analytics Dashboard
======================================
Live, anonymized analytics from a multi-tradition theological dialogue bot.

Source:  https://github.com/USERNAME/god_is_typing
Hosted:  https://god_is_typing-analytics.streamlit.app
Privacy: see docs/SECURITY.md — only aggregates surface here.

Architectural reference: ADR-0012 (analytics in Postgres, not Notion).
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta

import pandas as pd
import plotly.express as px
import psycopg2
import streamlit as st

# ── Page config ─────────────────────────────────────────────────────────
st.set_page_config(
    page_title="God is Typing — what humans ask the divine",
    page_icon="🕊️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Tiny styling — terminal-aesthetic accent
st.markdown(
    """
    <style>
      [data-testid="stMetricValue"] { font-family: 'JetBrains Mono', monospace; }
      h1, h2, h3 { letter-spacing: -0.02em; }
      .stCaption { opacity: 0.7; }
    </style>
    """,
    unsafe_allow_html=True,
)

# ── Header ──────────────────────────────────────────────────────────────
st.title("🕊️ God is Typing")
st.markdown(
    "##### *what humans ask the divine — a public, anonymized look*"
)
st.markdown(
    """
    Live analytics from a multi-tradition theological chatbot. No personal data
    is stored — phone numbers are SHA-256 hashed before any insertion, and this
    dashboard only reads from a `public_analytics` view that exposes aggregates.

    📖 [**Source code**](https://github.com/USERNAME/god_is_typing) ·
    💬 [**Try the bot**](https://wa.me/...) ·
    📜 [**Read the ADRs**](https://github.com/USERNAME/god_is_typing/tree/main/docs/adr) ·
    🔒 [**Privacy policy**](https://github.com/USERNAME/god_is_typing/blob/main/docs/SECURITY.md)
    """
)
st.divider()


# ── DB connection ───────────────────────────────────────────────────────
@st.cache_resource
def _get_conn():
    """Reuse a single connection across reruns."""
    return psycopg2.connect(
        host=st.secrets.get("POSTGRES_HOST", os.getenv("POSTGRES_HOST")),
        port=st.secrets.get("POSTGRES_PORT", os.getenv("POSTGRES_PORT", "5432")),
        user=st.secrets.get("POSTGRES_USER", os.getenv("POSTGRES_USER")),
        password=st.secrets.get("POSTGRES_PASSWORD", os.getenv("POSTGRES_PASSWORD")),
        dbname=st.secrets.get("POSTGRES_DATABASE", os.getenv("POSTGRES_DATABASE", "postgres")),
    )


@st.cache_data(ttl=300)  # 5-minute cache to keep load on free-tier Postgres low
def _query(sql: str, params: tuple = ()) -> pd.DataFrame:
    with _get_conn() as conn:
        return pd.read_sql(sql, conn, params=params)


# ── Top-level metrics row ───────────────────────────────────────────────
totals = _query("""
    select
      coalesce(sum(question_count), 0)            as total_questions,
      count(distinct tradition)                   as traditions_used,
      count(distinct question_topic)              as unique_topics,
      coalesce(max(day), now())                   as latest_day
    from public_analytics
""")

c1, c2, c3, c4 = st.columns(4)
with c1:
    st.metric("Questions answered", f"{int(totals.total_questions.iloc[0]):,}")
with c2:
    st.metric("Traditions consulted", int(totals.traditions_used.iloc[0]))
with c3:
    st.metric("Unique topics", int(totals.unique_topics.iloc[0]))
with c4:
    st.metric("Open source?", "yes 💛")

st.divider()


# ── Two main charts ─────────────────────────────────────────────────────
left, right = st.columns(2)

with left:
    st.subheader("Most-consulted traditions")
    df_trad = _query("""
        select tradition, sum(question_count) as count
        from public_analytics
        group by tradition
        order by count desc
    """)
    if df_trad.empty:
        st.info("No data yet — be the first to ask something.")
    else:
        fig = px.bar(
            df_trad, x="tradition", y="count",
            color="tradition",
            color_discrete_sequence=px.colors.qualitative.Set2,
        )
        fig.update_layout(
            showlegend=False, height=380,
            xaxis_title=None, yaxis_title=None,
            margin=dict(l=0, r=0, t=10, b=0),
        )
        st.plotly_chart(fig, use_container_width=True)

with right:
    st.subheader("Most-asked topics")
    df_topic = _query("""
        select question_topic, sum(question_count) as count
        from public_analytics
        where question_topic is not null
        group by question_topic
        order by count desc
        limit 15
    """)
    if df_topic.empty:
        st.info("No data yet.")
    else:
        fig = px.bar(
            df_topic, x="count", y="question_topic", orientation="h",
            color_discrete_sequence=["#7c3aed"],
        )
        fig.update_layout(
            height=380,
            xaxis_title=None, yaxis_title=None,
            margin=dict(l=0, r=0, t=10, b=0),
            yaxis=dict(autorange="reversed"),
        )
        st.plotly_chart(fig, use_container_width=True)


# ── Time series ─────────────────────────────────────────────────────────
st.subheader("Questions over time, by tradition")
df_time = _query("""
    select day, tradition, sum(question_count) as count
    from public_analytics
    where day > now() - interval '30 days'
    group by day, tradition
    order by day
""")

if df_time.empty:
    st.info("Not enough history yet — come back tomorrow.")
else:
    fig = px.area(
        df_time, x="day", y="count", color="tradition",
        color_discrete_sequence=px.colors.qualitative.Set2,
    )
    fig.update_layout(
        height=380,
        xaxis_title=None, yaxis_title="questions / day",
        margin=dict(l=0, r=0, t=10, b=0),
    )
    st.plotly_chart(fig, use_container_width=True)


# ── Cross-tab: tradition × topic ────────────────────────────────────────
with st.expander("🔬 Deep dive: tradition × topic heatmap"):
    df_heat = _query("""
        select tradition, question_topic, sum(question_count) as count
        from public_analytics
        where question_topic is not null
        group by tradition, question_topic
    """)
    if df_heat.empty:
        st.info("Not enough data.")
    else:
        pivot = df_heat.pivot_table(
            index="question_topic", columns="tradition", values="count", fill_value=0,
        )
        fig = px.imshow(
            pivot, color_continuous_scale="Purples", aspect="auto",
        )
        fig.update_layout(
            height=500, margin=dict(l=0, r=0, t=10, b=0),
            xaxis_title=None, yaxis_title=None,
        )
        st.plotly_chart(fig, use_container_width=True)
        st.caption(
            "Read this as: **which traditions get asked about which topics?** "
            "Patterns here tell us about cultural framing of universal questions."
        )


# ── Footer ──────────────────────────────────────────────────────────────
st.divider()
st.caption(
    """
    God is Typing respects your privacy. Phone numbers are SHA-256 hashed before any
    storage. Question text is never displayed publicly — only the topic and
    tradition. The full data-handling policy is in
    [docs/SECURITY.md](https://github.com/USERNAME/god_is_typing/blob/main/docs/SECURITY.md).
    Data refreshes every 5 minutes. Built with Streamlit + Postgres.
    """
)
