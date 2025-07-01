import { _decorator, Component } from "cc";
import { Card } from "./Card";
const { ccclass, property } = _decorator;

@ccclass("CardHolder")
export class CardHolder extends Component {
  private selectedCard: Card = null;

  cards: Card[] = [];

  onLoad() {
    const selectCardCb = this.onSelectingCard.bind(this);
    const deSelectCardCb = this.onDeselectingCard.bind(this);

    this.cards = this.getComponentsInChildren(Card);
    this.cards.forEach((card) => {
      card.setSelectingCardCb(selectCardCb);
      card.setDeSelectingCardCb(deSelectCardCb);
    });
  }

  private onSelectingCard(card: Card) {
    this.selectedCard = card;
  }

  private onDeselectingCard(_: Card) {
    this.selectedCard = null;
  }

  update(deltaTime: number) {
    if (this.selectedCard == null) return;

    for (let i = 0; i < this.cards.length; i++) {
      const anchor = this.cards[i];
      if (
        this.selectedCard.node.worldPosition.x > anchor.node.worldPosition.x &&
        this.selectedCard.parentIdx <
          anchor.parentIdx
      ) {
        this.swap(i);
        break;
      }

      if (
        this.selectedCard.node.worldPosition.x < anchor.node.worldPosition.x &&
        this.selectedCard.parentIdx >
          anchor.parentIdx
      ) {
        this.swap(i);
        break;
      }
    }
  }

  swap(idx: number) {
    const focusesParent = this.selectedCard.node.parent;
    const crossedParent = this.cards[idx].node.parent;
    this.cards[idx].node.setParent(focusesParent);
    this.cards[idx].node.setPosition(0, 0);
    this.selectedCard.node.setParent(crossedParent, true);

    const swapIsRight =
      this.cards[idx].parentIdx >
      this.selectedCard.parentIdx;
    this.cards[idx].cardVisual.swap(swapIsRight ? -1 : 1);

    this.node.children.forEach((child) => {
      child.getComponentInChildren(Card).cardVisual.updateIndex();
    });
  }
}
