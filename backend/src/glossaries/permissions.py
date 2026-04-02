"""
Module for putting permission restrictions on database queries for glossaries.
"""

import uuid
from typing import Any

from sqlalchemy import Delete, Select, Update, and_, exists, select

from ..auth.constants import UserType
from ..auth.models import User
from ..novels import models as novel_models
from ..novels.permissions import novel_mod_access_select
from .constants import GlossaryRole
from .models import Glossary, GlossaryContributor, GlossaryEntry


def glossary_mod_access_select[T: Select[tuple[Any, ...]]](
    q: T, current_user: User | None, only_editors: bool = False
) -> T:
    """
    Takes a select statement for glossaries and returns a select statement that restricts permissions on q.

    Admin: no restriction.
    Guest (None): novel must be public/unlisted.
    Regular user: novel access + is a glossary contributor.
    """
    q_exists_novel = (
        select(novel_models.Novel.novel_id).where(novel_models.Novel.novel_id == Glossary.novel_id).correlate(Glossary)
    )
    q_exists_novel = novel_mod_access_select(q_exists_novel, current_user)
    q = q.where(exists(q_exists_novel))
    if current_user is not None and current_user.user_type != UserType.ADMIN:
        contributor_where = [
            GlossaryContributor.glossary_id == Glossary.glossary_id,
            GlossaryContributor.user_id == current_user.user_id,
        ]
        if only_editors:
            contributor_where.append(
                GlossaryContributor.glossary_contributor_role.in_([GlossaryRole.OWNER, GlossaryRole.EDITOR])
            )
        return q.where(exists(select(1).select_from(GlossaryContributor).where(and_(*contributor_where))))
    return q


def glossary_mod_access_insert[T: Select[tuple[Any, ...]]](q: T, current_user: User, novel_id: uuid.UUID) -> T:
    """
    Takes a select statement used for an insert statement for glossaries and restricts permissions to require novel access.
    """
    q_exists_novel = select(novel_models.Novel.novel_id).where(novel_models.Novel.novel_id == novel_id)
    q_exists_novel = novel_mod_access_select(q_exists_novel, current_user)
    q = q.where(exists(q_exists_novel))
    return q


def glossary_mod_access_update[T: Update](q: T, current_user: User) -> T:
    """
    Takes an update statement for glossaries and restricts permissions to owner/editor contributors.
    """
    q_exists_novel = (
        select(novel_models.Novel.novel_id).where(novel_models.Novel.novel_id == Glossary.novel_id).correlate(Glossary)
    )
    q_exists_novel = novel_mod_access_select(q_exists_novel, current_user)
    q = q.where(exists(q_exists_novel))
    if current_user.user_type != UserType.ADMIN:
        return q.where(
            exists(
                select(1)
                .select_from(GlossaryContributor)
                .where(
                    and_(
                        GlossaryContributor.glossary_id == Glossary.glossary_id,
                        GlossaryContributor.user_id == current_user.user_id,
                        GlossaryContributor.glossary_contributor_role.in_([GlossaryRole.OWNER, GlossaryRole.EDITOR]),
                    )
                )
            )
        )
    return q


def glossary_mod_access_delete[T: Delete](q: T, current_user: User) -> T:
    """
    Takes a delete statement for glossaries and restricts permissions to owners only.
    """
    q_exists_novel = (
        select(novel_models.Novel.novel_id).where(novel_models.Novel.novel_id == Glossary.novel_id).correlate(Glossary)
    )
    q_exists_novel = novel_mod_access_select(q_exists_novel, current_user)
    q = q.where(exists(q_exists_novel))
    if current_user.user_type != UserType.ADMIN:
        return q.where(
            exists(
                select(1)
                .select_from(GlossaryContributor)
                .where(
                    and_(
                        GlossaryContributor.glossary_id == Glossary.glossary_id,
                        GlossaryContributor.user_id == current_user.user_id,
                        GlossaryContributor.glossary_contributor_role == GlossaryRole.OWNER,
                    )
                )
            )
        )
    return q


def glossary_entry_mod_access_select[T: Select[tuple[Any, ...]]](q: T, current_user: User | None) -> T:
    """
    Takes a select statement for glossary entries and restricts permissions via glossary select access.
    """
    q_exists_glossary = (
        select(Glossary.glossary_id).where(Glossary.glossary_id == GlossaryEntry.glossary_id).correlate(GlossaryEntry)
    )
    q_exists_glossary = glossary_mod_access_select(q_exists_glossary, current_user)
    return q.where(exists(q_exists_glossary))


def glossary_entry_mod_access_insert[T: Select[tuple[Any, ...]]](q: T, current_user: User, glossary_id: uuid.UUID) -> T:
    """
    Takes a select statement used for an insert into glossary entries and restricts to owner/editor.
    """
    if current_user.user_type != UserType.ADMIN:
        return q.where(
            exists(
                select(1)
                .select_from(GlossaryContributor)
                .where(
                    and_(
                        GlossaryContributor.glossary_id == glossary_id,
                        GlossaryContributor.user_id == current_user.user_id,
                        GlossaryContributor.glossary_contributor_role.in_([GlossaryRole.OWNER, GlossaryRole.EDITOR]),
                    )
                )
            )
        )
    return q


def glossary_entry_mod_access_update[T: Update](q: T, current_user: User) -> T:
    """
    Takes an update statement for glossary entries and restricts to owner/editor of the parent glossary.
    """
    if current_user.user_type != UserType.ADMIN:
        return q.where(
            exists(
                select(1)
                .select_from(GlossaryContributor)
                .where(
                    and_(
                        GlossaryContributor.glossary_id == GlossaryEntry.glossary_id,
                        GlossaryContributor.user_id == current_user.user_id,
                        GlossaryContributor.glossary_contributor_role.in_([GlossaryRole.OWNER, GlossaryRole.EDITOR]),
                    )
                )
            )
        )
    return q


def glossary_entry_mod_access_delete[T: Delete](q: T, current_user: User) -> T:
    """
    Takes a delete statement for glossary entries and restricts to owner/editor of the parent glossary.
    """
    if current_user.user_type != UserType.ADMIN:
        return q.where(
            exists(
                select(1)
                .select_from(GlossaryContributor)
                .where(
                    and_(
                        GlossaryContributor.glossary_id == GlossaryEntry.glossary_id,
                        GlossaryContributor.user_id == current_user.user_id,
                        GlossaryContributor.glossary_contributor_role.in_([GlossaryRole.OWNER, GlossaryRole.EDITOR]),
                    )
                )
            )
        )
    return q
