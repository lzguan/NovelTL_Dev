# Design document

## v1

The goal with this project is to create a platform for a trusted group of users to assist in translations. Specifically, we aim to create tooling to assist in the following tasks:
- Store and organize documents to be translated.
- Provide a framework to be able to use Named Entity Recognition (NER) models to label data from documents automatically.
- Provide a platform for users to be able to manually add/edit labels (including those generated from the NER model).
- View statistics/aggregate data about labels for specific documents/document classes.
- Use data about the labels to feed into some sort of translation software (for example, an LLM) to ensure consistent translations.

In this document, we will outline the specifications for this project and describe the models/decisions used to achieve this.

### Motivation

Right now, Large Language Models (LLMs) are an effective tool for creating high-quality translations for short documents. For longer documents, especially novels, LLMs have issues translating names consistently. To solve this problem, a tool to be able to identify all named entities in a novel is essential. The overall goal for this project is to present a platform for users to be able to efficiently automatically label data, while providing room to edit labeling, and for users to be able to use this labeling in LLM translations along with the capacity to edit these translations. In **v1**, this project is tailored specifically to novel translations, which explains some of the naming decisions. 

### High level overview

We will divide this applications into distinct services. 

#### Users
- This service will handle user authentication, along with storing user metadata. 
- Other services will retrieve information about the current user from this service to determine user read/write permissions for that specific service.
- There are two types of users: _admin_ and _user_. Admins have near full access to modify anything in the database, while users have restricted functionality.
#### Novels
- This service will store metadata about novels, along with the actual text for chapters. 
- The service will store a database of _novels_, which in turn will be associated with a list of _raw chapters_.
- In order to ensure that editing chapters does not affect labeling, we associate each chapter with a list of _raw chapter revisions_. Revisions can be marked as final to mark them as immutable. 
- Both users and guests are able to access all novels and chapters. Chapter revisions can be marked as either public or private. Chapter revisions marked as private can only be accessed to admins, while chapter revisions marked as public can be accessed by all users.
#### Labels
- This service will store information about the labeling for novels. 
- Labels are associated with _label groups_, which can be further subdivided into _label datas_, each associated with a single chapter revision (not just chapter). Specific _labels_ are then associated to Label Datas. 
- Each label consists of a start/end position, along with the word being labeled and a text category (e.g. PERSON, LOCATION, etc.).
- Each label group is associated with a novel and a user. The only users able to access this label group now are the user that created this label group and the admins.
- Users are able to call an autolabeler on a list of raw chapter revisions that they have access to. The results of these calls will be stored as _auto labels_, for which each one is associated with a chapter revision, along with a _model_ and the parameters used in that model. Users can then pull results in auto labels to be used in label groups. Auto labels store the auto-labeled data in JSON format.
    - The reason we store the results of autolabeling into auto labels is to limit NER calls. Two users may be working on the same novel and may wish to both autogenerate labels using the same model. 
- Users are able to aggregate data in a label group to create _glossaries_. Each glossary corresponds to a label group. A glossary stores a JSON dict with entries of the form `term : (translation_of_term, description_of_term)`. Users must manually regenerate glossaries to ensure they are up to date with the current labelling. Glossaries that are not up to date with labelling are marked as such.

#### Translations
- Details not yet decided. Will likely follow the same schema as **Novels**. Autogeneration will take glossaries from the **Labels** service and pipe it into an LLM.

## v2

